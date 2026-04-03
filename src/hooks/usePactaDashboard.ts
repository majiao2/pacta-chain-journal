import { useCallback, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseEther } from "viem";
import { useAccount, useChainId } from "wagmi";
import { habits, type Habit, type HabitCategory } from "@/data/habitsData";
import { FUJI_CHAIN_ID } from "@/lib/chains";
import { FREQUENCY_TO_UINT, UINT_TO_FREQUENCY_LABEL, type FrequencyKey } from "@/lib/pacta";
import {
  claimMockReward,
  createMockPact,
  getUserDashboard,
  recordMockCheckin,
  resetMockDemoData,
  syncPactsToMockApi,
  type ApiPact,
} from "@/lib/mockApi";
import { usePactaChainReads, type OnChainPact } from "@/hooks/usePactaChain";
import { DEMO_WALLET, useDemoModeStore } from "@/store/demoModeStore";

export type DashboardPact = OnChainPact & {
  source: "chain" | "mock";
  category: ApiPact["category"];
  frequencyLabel: string;
  rewardClaimed: boolean;
  checkinCount: number;
  currentStreak: number;
  completionRate: number;
  nextMicroHabit: string;
  summary: string;
  latestEncouragement: string | null;
};

function toUnixSeconds(isoString: string | null) {
  if (!isoString) return 0n;
  return BigInt(Math.floor(new Date(isoString).getTime() / 1000));
}

function toMockDashboardPact(pact: ApiPact): DashboardPact {
  return {
    id: BigInt(pact.id),
    user: pact.wallet as `0x${string}`,
    habitName: pact.habitName,
    stakeAmount: BigInt(pact.stakeAmountWei),
    frequency: BigInt(pact.frequencyCode),
    startTime: toUnixSeconds(pact.startAt),
    lastCheckin: toUnixSeconds(pact.lastCheckinAt),
    durationDays: BigInt(pact.durationDays),
    completed: pact.completed,
    source: "mock",
    category: pact.category,
    frequencyLabel: pact.frequencyLabel,
    rewardClaimed: pact.rewardClaimed,
    checkinCount: pact.checkinCount,
    currentStreak: pact.currentStreak,
    completionRate: pact.completionRate,
    nextMicroHabit: pact.nextMicroHabit,
    summary: pact.summary,
    latestEncouragement: pact.latestEncouragement,
  };
}

function mergeChainPactWithApi(pact: OnChainPact, apiPact?: ApiPact): DashboardPact {
  const defaultCheckinCount = pact.lastCheckin > 0n ? 1 : 0;

  return {
    ...pact,
    source: "chain",
    category: apiPact?.category ?? "unknown",
    frequencyLabel: apiPact?.frequencyLabel ?? UINT_TO_FREQUENCY_LABEL[pact.frequency.toString()] ?? "未设置",
    rewardClaimed: apiPact?.rewardClaimed ?? false,
    checkinCount: apiPact?.checkinCount ?? defaultCheckinCount,
    currentStreak: apiPact?.currentStreak ?? 0,
    completionRate: apiPact?.completionRate ?? 0,
    nextMicroHabit: apiPact?.nextMicroHabit ?? "先完成今天最容易开始的一步",
    summary: apiPact?.summary ?? "链上记录已读取，等待后端生成更完整的坚持总结。",
    latestEncouragement: apiPact?.latestEncouragement ?? null,
  };
}

function getHabitCategoryByName(habitName: string): HabitCategory | "unknown" {
  return habits.find((habit) => habit.name === habitName)?.category ?? "unknown";
}

export function usePactaDashboard() {
  const queryClient = useQueryClient();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const isFuji = chainId === FUJI_CHAIN_ID;
  const demoMode = useDemoModeStore((state) => state.enabled);
  const demoWallet = useDemoModeStore((state) => state.wallet);
  const wallet = demoMode ? demoWallet : address;
  const effectiveWallet = wallet ?? DEMO_WALLET;

  const chainReads = usePactaChainReads(!demoMode);

  const dashboardQuery = useQuery({
    queryKey: ["mock-dashboard", effectiveWallet],
    queryFn: () => getUserDashboard(effectiveWallet),
    enabled: Boolean(effectiveWallet),
    refetchOnWindowFocus: false,
  });

  const syncPayload = useMemo(
    () =>
      !demoMode && address
        ? chainReads.myPacts.map((pact) => ({
            id: pact.id.toString(),
            wallet: address,
            habitName: pact.habitName,
            category: getHabitCategoryByName(pact.habitName),
            frequencyLabel: UINT_TO_FREQUENCY_LABEL[pact.frequency.toString()] ?? `码值 ${pact.frequency.toString()}`,
            frequencyCode: pact.frequency.toString(),
            durationDays: Number(pact.durationDays),
            stakeAmountWei: pact.stakeAmount.toString(),
            startAt: new Date(Number(pact.startTime) * 1000).toISOString(),
            lastCheckinAt: pact.lastCheckin > 0n ? new Date(Number(pact.lastCheckin) * 1000).toISOString() : null,
            completed: pact.completed,
          }))
        : [],
    [address, chainReads.myPacts, demoMode],
  );

  const syncSignature = useMemo(() => JSON.stringify(syncPayload), [syncPayload]);

  useEffect(() => {
    if (demoMode || !address || !isFuji) return;
    if (!syncPayload.length) return;

    void syncPactsToMockApi(address, syncPayload).then(() => {
      void queryClient.invalidateQueries({
        queryKey: ["mock-dashboard", address],
      });
    });
  }, [address, demoMode, isFuji, queryClient, syncPayload, syncSignature]);

  const createMutation = useMutation({
    mutationFn: async ({
      habit,
      frequency,
      stake,
      durationDays,
      startAt,
    }: {
      habit: Habit;
      frequency: FrequencyKey;
      stake: number;
      durationDays: number;
      startAt: string;
    }) =>
      createMockPact({
        wallet: effectiveWallet,
        habit,
        frequency,
        frequencyLabel: UINT_TO_FREQUENCY_LABEL[FREQUENCY_TO_UINT[frequency].toString()] ?? "每天",
        frequencyCode: FREQUENCY_TO_UINT[frequency].toString(),
        durationDays,
        stakeAmountWei: parseEther(String(stake)).toString(),
        startAt,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["mock-dashboard", effectiveWallet],
      });
    },
  });

  const checkinMutation = useMutation({
    mutationFn: async ({ pactId, txHash }: { pactId: string; txHash?: `0x${string}` }) =>
      recordMockCheckin(effectiveWallet, pactId, txHash),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["mock-dashboard", effectiveWallet],
      });
    },
  });

  const claimMutation = useMutation({
    mutationFn: async ({ pactId }: { pactId: string }) => claimMockReward(effectiveWallet, pactId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["mock-dashboard", effectiveWallet],
      });
    },
  });

  const resetMutation = useMutation({
    mutationFn: resetMockDemoData,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["mock-dashboard"],
      });
    },
  });

  const backendById = useMemo(
    () => new Map((dashboardQuery.data?.pacts ?? []).map((pact) => [pact.id, pact])),
    [dashboardQuery.data?.pacts],
  );

  const pacts = useMemo(() => {
    if (demoMode) {
      return (dashboardQuery.data?.pacts ?? []).map(toMockDashboardPact);
    }

    return chainReads.myPacts.map((pact) => mergeChainPactWithApi(pact, backendById.get(pact.id.toString())));
  }, [backendById, chainReads.myPacts, dashboardQuery.data?.pacts, demoMode]);

  const rewardPoolWei = useMemo(() => {
    if (demoMode) {
      return dashboardQuery.data ? BigInt(dashboardQuery.data.rewardPoolWei) : 0n;
    }

    return chainReads.rewardPoolWei ?? (dashboardQuery.data ? BigInt(dashboardQuery.data.rewardPoolWei) : 0n);
  }, [chainReads.rewardPoolWei, dashboardQuery.data, demoMode]);

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: ["mock-dashboard", effectiveWallet],
    });
  }, [effectiveWallet, queryClient]);

  return {
    wallet: effectiveWallet,
    demoMode,
    isConnected: demoMode ? true : isConnected,
    isFuji: demoMode ? true : isFuji,
    rewardPoolWei,
    pacts,
    overview: dashboardQuery.data?.overview ?? null,
    isLoading: demoMode ? dashboardQuery.isLoading : chainReads.isLoading || dashboardQuery.isFetching,
    refresh,
    createDemoPact: createMutation.mutateAsync,
    isCreatingDemoPact: createMutation.isPending,
    recordBackendCheckin: checkinMutation.mutateAsync,
    isRecordingCheckin: checkinMutation.isPending,
    claimBackendReward: claimMutation.mutateAsync,
    isClaimingReward: claimMutation.isPending,
    resetDemoData: resetMutation.mutateAsync,
    isResettingDemoData: resetMutation.isPending,
  };
}
