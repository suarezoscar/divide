import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import * as groupsService from "../services/groups";
import type { Group, Member } from "../types";

export function useGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const result = await groupsService.getUserGroups(user.uid);
    setGroups(result);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const create = async (name: string, description: string, members: Member[]) => {
    if (!user) return;
    const g = await groupsService.createGroup(user.uid, name, description, members);
    setGroups((prev) => [g, ...prev]);
    return g;
  };

  return { groups, loading, create, refetch: fetchGroups };
}

export function useGroup(groupId: string) {
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    groupsService.getGroup(groupId).then((g) => {
      setGroup(g);
      setLoading(false);
    });
  }, [groupId]);

  const updateMembers = async (members: Member[]) => {
    await groupsService.updateGroupMembers(groupId, members);
    setGroup((prev) => (prev ? { ...prev, members } : null));
  };

  return { group, loading, updateMembers };
}
