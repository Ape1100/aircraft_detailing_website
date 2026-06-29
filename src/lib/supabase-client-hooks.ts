import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase-client";
import { useAuth } from "./auth-provider";
import { camelizeKeys } from "./supabase-mappers";
import type {
  Aircraft,
  AircraftCategory,
  DetailingReport,
  Invoice,
  Membership,
  ServiceRequest,
} from "@/types";

function useSupabaseList<T>(fetcher: (userId: string) => Promise<T[]>) {
  const { session, loading } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!session?.user?.id) {
      setData([]);
      setError(null);
      setLoadingData(false);
      return;
    }

    setLoadingData(true);
    setError(null);

    fetcher(session.user.id)
      .then((result) => {
        setData(result);
      })
      .catch((err: unknown) => {
        setError((err as { message?: string })?.message ?? String(err));
      })
      .finally(() => {
        setLoadingData(false);
      });
  }, [loading, session?.user?.id, fetcher, version]);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  return useMemo(
    () => ({ data, loading: loading || loadingData, error, refetch }),
    [data, error, loading, loadingData, refetch]
  );
}

export function useClientAircraft() {
  const fetcher = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("aircraft")
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }
    return camelizeKeys<Aircraft[]>(data ?? []);
  }, []);

  return useSupabaseList<Aircraft>(fetcher);
}

export function useClientRequests() {
  const fetcher = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("service_requests")
      .select("*, service_items(service_code)")
      .eq("client_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return camelizeKeys<any[]>(data ?? []).map((row: any) => ({
      ...row,
      services:
        row.services?.length > 0 ? row.services : row.serviceItems?.map((item: any) => item.serviceCode) ?? [],
    })) as ServiceRequest[];
  }, []);

  return useSupabaseList<ServiceRequest>(fetcher);
}

export function useClientInvoices() {
  const fetcher = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("client_id", userId)
      .order("issued_at", { ascending: false });

    if (error) {
      throw error;
    }
    return camelizeKeys<Invoice[]>(data ?? []);
  }, []);

  return useSupabaseList<Invoice>(fetcher);
}

export function useClientMembership() {
  const { session, loading } = useAuth();
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!session?.user?.id) {
      setMembership(null);
      setError(null);
      setLoadingData(false);
      return;
    }

    setLoadingData(true);
    setError(null);

    const loadMembership = async () => {
      try {
        const { data, error } = await supabase
          .from("memberships")
          .select("*")
          .eq("client_id", session.user.id)
          .limit(1)
          .maybeSingle();

        if (error) {
          throw error;
        }

        setMembership(data ? camelizeKeys<Membership>(data) : null);
      } catch (err: unknown) {
        setError((err as { message?: string })?.message ?? String(err));
      } finally {
        setLoadingData(false);
      }
    };

    void loadMembership();
  }, [loading, session?.user?.id]);

  return useMemo(
    () => ({ membership, loading: loading || loadingData, error }),
    [loading, loadingData, membership, error]
  );
}

export function useClientReports() {
  const fetcher = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("detailing_reports")
      .select("*, report_photos(*), observed_issues(*)")
      .eq("client_id", userId)
      .order("service_date", { ascending: false });

    if (error) {
      throw error;
    }

    return camelizeKeys<any[]>(data ?? []).map((row: any) => ({
      ...row,
      photos: row.reportPhotos ?? [],
      observedIssues: row.observedIssues ?? [],
    })) as DetailingReport[];
  }, []);

  return useSupabaseList<DetailingReport>(fetcher);
}

export async function addAircraft(
  ownerId: string,
  tailNumber: string,
  make: string,
  model: string,
  category: AircraftCategory,
  year: number | null,
  homeAirport: string,
  hangared: boolean
) {
  const { data, error } = await supabase
    .from("aircraft")
    .insert([
      {
        owner_id: ownerId,
        tail_number: tailNumber,
        make,
        model,
        category,
        year,
        home_airport: homeAirport,
        hangared,
      },
    ])
    .select("id")
    .single();

  if (error || !data?.id) {
    throw error ?? new Error("Failed to add aircraft");
  }

  return data.id as string;
}

export async function createServiceRequest(
  userId: string,
  aircraftId: string,
  services: string[],
  preferredDate: string | null,
  airportLocation: string,
  fboName: string | null,
  notes: string | null
) {
  const { data, error } = await supabase
    .from("service_requests")
    .insert([
      {
        aircraft_id: aircraftId,
        client_id: userId,
        preferred_date: preferredDate || null,
        airport_location: airportLocation,
        fbo_name: fboName || null,
        notes: notes || null,
        status: "requested",
      },
    ])
    .select("id")
    .single();

  if (error || !data?.id) {
    throw error ?? new Error("Failed to create service request");
  }

  const requestId = data.id;
  const items = services.map((serviceCode) => ({
    request_id: requestId,
    service_code: serviceCode,
  }));

  const { error: itemError } = await supabase.from("service_items").insert(items);
  if (itemError) {
    throw itemError;
  }

  return requestId;
}
