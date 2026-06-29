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
  RequestStatus,
  ServiceRequest,
} from "@/types";

/** A service_requests row as seen by the admin portal — joined with the
 * fields a list/detail view needs (aircraft identity, client name, photo
 * count) that the plain client-side ServiceRequest type has no use for. */
export interface AdminServiceRequest extends ServiceRequest {
  aircraft: { tailNumber: string; make: string; model: string };
  clientName: string;
  photoCount: number;
}

export interface AdminClient {
  id: string;
  name: string;
  email: string;
  company: string | null;
  aircraftCount: number;
}

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

/** All service requests, for the admin portal. Unlike the client-side
 * hooks above, this has no .eq("client_id", ...) filter — the "Requests:
 * owner or admin" RLS policy already grants an admin session read access
 * to every row, so the userId argument useSupabaseList passes in is
 * simply unused here (it still gates on having an authenticated session
 * at all, which is what we want). */
export function useAdminRequests() {
  const fetcher = useCallback(async () => {
    const { data, error } = await supabase
      .from("service_requests")
      .select("*, aircraft(tail_number,make,model), profiles(name), service_items(service_code), request_photos(id)")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return camelizeKeys<any[]>(data ?? []).map((row: any) => ({
      ...row,
      services:
        row.services?.length > 0 ? row.services : row.serviceItems?.map((item: any) => item.serviceCode) ?? [],
      aircraft: row.aircraft,
      clientName: row.profiles?.name ?? "Unknown client",
      photoCount: row.requestPhotos?.length ?? 0,
    })) as AdminServiceRequest[];
  }, []);

  return useSupabaseList<AdminServiceRequest>(fetcher);
}

/** All client-role profiles with an aircraft count, for the admin client
 * list. Same RLS reasoning as useAdminRequests above — "Profiles: self or
 * admin read" already grants an admin session visibility into every row. */
export function useAdminClients() {
  const fetcher = useCallback(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id,name,email,company,aircraft(count)")
      .eq("role", "client")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return camelizeKeys<any[]>(data ?? []).map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      company: row.company,
      aircraftCount: row.aircraft?.[0]?.count ?? 0,
    })) as AdminClient[];
  }, []);

  return useSupabaseList<AdminClient>(fetcher);
}

/** Single mutation covering every admin-side request transition: editing
 * the estimate range, confirming (-> approved), scheduling (-> scheduled +
 * scheduledDate), and the in_progress/completed/cancelled status changes —
 * all are just a partial update on the same row. */
export async function updateServiceRequest(
  requestId: string,
  fields: Partial<{
    estimateLow: number | null;
    estimateHigh: number | null;
    status: RequestStatus;
    scheduledDate: string | null;
  }>
) {
  const payload: Record<string, unknown> = {};
  if ("estimateLow" in fields) payload.estimate_low = fields.estimateLow;
  if ("estimateHigh" in fields) payload.estimate_high = fields.estimateHigh;
  if ("status" in fields) payload.status = fields.status;
  if ("scheduledDate" in fields) payload.scheduled_date = fields.scheduledDate;

  const { error } = await supabase.from("service_requests").update(payload).eq("id", requestId);
  if (error) {
    throw error;
  }
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

/** Uploads each file to the (private) aircraft-photos bucket under
 * <userId>/<requestId>/<filename> — that folder convention is required by
 * the bucket's "owner folder or admin" storage RLS policy, which checks
 * that the first path segment equals auth.uid(). Inserts one
 * request_photos row per successful upload, storing the storage path
 * (not a public URL, since the bucket is private — see
 * getSignedPhotoUrl for how admins resolve it for viewing). */
export async function uploadRequestPhotos(userId: string, requestId: string, files: File[]) {
  for (const file of files) {
    const path = `${userId}/${requestId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("aircraft-photos").upload(path, file);
    if (uploadError) {
      throw uploadError;
    }

    const { error: insertError } = await supabase.from("request_photos").insert({
      request_id: requestId,
      url: path,
    });
    if (insertError) {
      throw insertError;
    }
  }
}

/** Resolves a request_photos.url (a storage path) to a temporary signed
 * URL for display, since the aircraft-photos bucket is private. */
export async function getSignedPhotoUrl(path: string, expiresInSeconds = 3600) {
  const { data, error } = await supabase.storage.from("aircraft-photos").createSignedUrl(path, expiresInSeconds);
  if (error || !data?.signedUrl) {
    throw error ?? new Error("Failed to sign photo URL");
  }
  return data.signedUrl;
}
