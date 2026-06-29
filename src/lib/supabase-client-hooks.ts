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
  ServiceDefinition,
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
  phone: string | null;
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
      .select("id,name,email,phone,company,aircraft(count)")
      .eq("role", "client")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return camelizeKeys<any[]>(data ?? []).map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      company: row.company,
      aircraftCount: row.aircraft?.[0]?.count ?? 0,
    })) as AdminClient[];
  }, []);

  return useSupabaseList<AdminClient>(fetcher);
}

/** A specific client's aircraft + full service request history, for the
 * admin client detail view. Lazy: only fetches once `clientId` is set
 * (i.e. once a client row is actually clicked), rather than loading every
 * client's data up front. */
export function useAdminClientDetail(clientId: string | null) {
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [requests, setRequests] = useState<AdminServiceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) {
      setAircraft([]);
      setRequests([]);
      return;
    }

    setLoading(true);
    setError(null);

    Promise.all([
      supabase.from("aircraft").select("*").eq("owner_id", clientId).order("created_at", { ascending: false }),
      supabase
        .from("service_requests")
        .select("*, aircraft(tail_number,make,model), service_items(service_code)")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false }),
    ])
      .then(([aircraftRes, requestsRes]) => {
        if (aircraftRes.error) throw aircraftRes.error;
        if (requestsRes.error) throw requestsRes.error;

        setAircraft(camelizeKeys<Aircraft[]>(aircraftRes.data ?? []));
        setRequests(
          camelizeKeys<any[]>(requestsRes.data ?? []).map((row: any) => ({
            ...row,
            services:
              row.services?.length > 0 ? row.services : row.serviceItems?.map((item: any) => item.serviceCode) ?? [],
            aircraft: row.aircraft,
            clientName: "",
            photoCount: 0,
          })) as AdminServiceRequest[]
        );
      })
      .catch((err: unknown) => {
        setError((err as { message?: string })?.message ?? String(err));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [clientId]);

  return { aircraft, requests, loading, error };
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
  notes: string | null,
  estimateLow: number | null = null,
  estimateHigh: number | null = null
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
        estimate_low: estimateLow,
        estimate_high: estimateHigh,
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

/** Some catalog services are several distinct physical tasks bundled
 * under one code (confirmed against DEFAULT_SERVICES' own description
 * text, not guessed) — a checklist that shows the bundle as a single
 * line doesn't actually prevent missing a sub-task within it. */
export const CHECKLIST_BUNDLE_MAP: Record<string, string[]> = {
  complete_detail: ["exterior_wash", "interior_refresh", "belly_cleaning"],
  presale_cleanup: ["exterior_wash", "interior_refresh", "belly_cleaning", "window_polishing", "brightwork_polish"],
};

export interface ChecklistItem {
  id: string;
  requestId: string;
  itemCode: string;
  label: string;
  completed: boolean;
  completedAt: string | null;
  completedBy: string | null;
}

/** A request's on-site checklist, seeded once (check-then-insert, never
 * reseeded) the first time it's opened. `requestServices` and
 * `serviceCatalog` are only read at seed time — pass them in once the
 * parent request has actually loaded; this intentionally depends on just
 * `requestId` so it doesn't refire if those arrays happen to get a new
 * reference on a later render (see useSupabaseList's history in this
 * file for why an unstable dependency here would be a real bug, not a
 * style nit). */
export function useRequestChecklist(
  requestId: string | null,
  requestServices: string[],
  serviceCatalog: ServiceDefinition[]
) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!requestId) {
      setItems([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const { data, error: selectError } = await supabase
          .from("request_checklist_items")
          .select("*")
          .eq("request_id", requestId)
          .order("created_at", { ascending: true });
        if (selectError) throw selectError;

        let rows = camelizeKeys<ChecklistItem[]>(data ?? []);

        if (rows.length === 0 && requestServices.length > 0) {
          const seedRows: { request_id: string; item_code: string; label: string }[] = [];
          for (const code of requestServices) {
            if (code === "membership_quote") continue;
            const bundle = CHECKLIST_BUNDLE_MAP[code];
            if (bundle) {
              // Two different bundles can share a sub-task (e.g. both
              // complete_detail and presale_cleanup include exterior_wash)
              // — label with the parent bundle so two same-named rows on
              // one request read as distinct tasks, not a duplicate.
              const bundleLabel = serviceCatalog.find((s) => s.code === code)?.name ?? code;
              for (const subCode of bundle) {
                const subLabel = serviceCatalog.find((s) => s.code === subCode)?.name ?? subCode;
                seedRows.push({
                  request_id: requestId,
                  item_code: `${code}__${subCode}`,
                  label: `${subLabel} (${bundleLabel})`,
                });
              }
            } else {
              seedRows.push({
                request_id: requestId,
                item_code: code,
                label: serviceCatalog.find((s) => s.code === code)?.name ?? code,
              });
            }
          }

          if (seedRows.length > 0) {
            const { data: inserted, error: insertError } = await supabase
              .from("request_checklist_items")
              .insert(seedRows)
              .select("*");
            if (insertError) throw insertError;
            rows = camelizeKeys<ChecklistItem[]>(inserted ?? []);
          }
        }

        if (!cancelled) setItems(rows);
      } catch (err) {
        if (!cancelled) setError((err as Error).message ?? String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  return { items, setItems, loading, error };
}

/** Toggles one checklist item. Callers should update local state
 * optimistically and revert on failure — this can't be a "save at the
 * end" flow, since closing the tab mid-job shouldn't lose progress. */
export async function toggleChecklistItem(itemId: string, completed: boolean, adminUserId: string) {
  const { error } = await supabase
    .from("request_checklist_items")
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
      completed_by: completed ? adminUserId : null,
    })
    .eq("id", itemId);
  if (error) {
    throw error;
  }
}
