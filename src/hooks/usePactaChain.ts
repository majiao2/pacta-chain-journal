import { useMemo } from "react";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { getAddress, zeroAddress } from "viem";
import { pactaAbi } from "@/abi/pactaAbi";
import { PACTA_ADDRESS } from "@/lib/pacta";

export type OnChainPact = {
  id: bigint;
  user: `0x${string}`;
  habitName: string;
  stakeAmount: bigint;
  frequency: bigint;
  startTime: bigint;
  lastCheckin: bigint;
  durationDays: bigint;
  completed: boolean;
  checkinCount: bigint;
  streak: bigint;
  claimed: boolean;
};

function parsePactRow(result: unknown): Omit<OnChainPact, "id"> | null {
  if (!result || typeof result !== "object") return null;
  const r = result as Record<string, unknown>;
  const user = r.user as `0x${string}` | undefined;
  if (!user || user === zeroAddress) return null;
  return {
    user,
    habitName: String(r.habitName ?? ""),
    stakeAmount: BigInt(r.stakeAmount?.toString() ?? 0),
    frequency: BigInt(r.frequency?.toString() ?? 0),
    startTime: BigInt(r.startTime?.toString() ?? 0),
    lastCheckin: BigInt(r.lastCheckin?.toString() ?? 0),
    durationDays: BigInt(r.durationDays?.toString() ?? 0),
    completed: Boolean(r.completed),
    checkinCount: BigInt(r.checkinCount?.toString() ?? 0),
    streak: BigInt(r.streak?.toString() ?? 0),
    claimed: Boolean(r.claimed),
  };
}

export function usePactaChainReads(enabled = true) {
  const { address } = useAccount();

  const { data: counter, isFetched: counterFetched } = useReadContract({
    address: PACTA_ADDRESS,
    abi: pactaAbi,
    functionName: "pactCounter",
    query: { enabled },
  });

  const { data: rewardPoolWei } = useReadContract({
    address: PACTA_ADDRESS,
    abi: pactaAbi,
    functionName: "getRewardPool",
    query: { enabled },
  });

  const count = counter !== undefined ? Number(counter) : 0;

  const contracts0 = useMemo(
    () =>
      count > 0
        ? Array.from({ length: count }, (_, i) => ({
            address: PACTA_ADDRESS,
            abi: pactaAbi,
            functionName: "getPact" as const,
            args: [BigInt(i)] as const,
          }))
        : [],
    [count],
  );

  const {
    data: batch0,
    isFetched: fetched0,
    isFetching: loading0,
  } = useReadContracts({
    contracts: contracts0,
    query: { enabled: enabled && counterFetched && count > 0 },
  });

  const hasAnyUser0 = useMemo(() => {
    if (!fetched0 || !batch0?.length) return false;
    return batch0.some((row) => {
      if (row.status !== "success" || !row.result) return false;
      const p = parsePactRow(row.result);
      return !!p;
    });
  }, [batch0, fetched0]);

  const useOneBased = count > 0 && fetched0 && !hasAnyUser0;

  const contracts1 = useMemo(
    () =>
      useOneBased
        ? Array.from({ length: count }, (_, i) => ({
            address: PACTA_ADDRESS,
            abi: pactaAbi,
            functionName: "getPact" as const,
            args: [BigInt(i + 1)] as const,
          }))
        : [],
    [count, useOneBased],
  );

  const { data: batch1, isFetching: loading1 } = useReadContracts({
    contracts: contracts1,
    query: { enabled: enabled && useOneBased },
  });

  const effectiveBatch = useOneBased ? batch1 : batch0;
  const idOffset = useOneBased ? 1 : 0;

  const allPacts: OnChainPact[] = useMemo(() => {
    const out: OnChainPact[] = [];
    if (!effectiveBatch) return out;
    effectiveBatch.forEach((row, i) => {
      if (row.status !== "success" || !row.result) return;
      const base = parsePactRow(row.result);
      if (!base) return;
      out.push({ ...base, id: BigInt(i + idOffset) });
    });
    return out;
  }, [effectiveBatch, idOffset]);

  const myPacts = useMemo(() => {
    if (!address) return [];
    try {
      const me = getAddress(address);
      return allPacts.filter((p) => getAddress(p.user) === me);
    } catch {
      return [];
    }
  }, [allPacts, address]);

  const isLoading =
    (enabled && !counterFetched) ||
    (count > 0 && (!fetched0 || loading0)) ||
    (useOneBased && loading1);

  return {
    pactCounter: counter,
    rewardPoolWei: rewardPoolWei as bigint | undefined,
    allPacts,
    myPacts,
    isLoading,
  };
}
