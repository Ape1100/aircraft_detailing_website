import { useEffect, useRef, useState } from "react";
import { ImagePlus, ImageOff } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { getSignedPhotoUrl, uploadRequestPhotos } from "@/lib/supabase-client-hooks";

interface PhotoGalleryProps {
  requestId: string;
  /** The request's owning client id — used for the storage path
   * regardless of who's actually uploading. See uploadRequestPhotos'
   * doc comment for why this can't be the uploader's own id when an
   * admin is uploading on a client's behalf. */
  ownerId: string;
  /** Server-reported count at load time, just to avoid a wasted fetch
   * when a parent list query already knows there are zero photos. */
  initialCount: number;
  /** Set false to render a read-only gallery with no upload control. */
  editable?: boolean;
}

export function PhotoGallery({ requestId, ownerId, initialCount, editable = true }: PhotoGalleryProps) {
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(initialCount > 0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadPhotos() {
    setLoading(true);
    const { data } = await supabase.from("request_photos").select("url").eq("request_id", requestId);
    const urls = await Promise.all((data ?? []).map((row) => getSignedPhotoUrl(row.url)));
    setPhotoUrls(urls);
    setLoading(false);
  }

  useEffect(() => {
    if (initialCount > 0) {
      loadPhotos();
    } else {
      setPhotoUrls([]);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      await uploadRequestPhotos(ownerId, requestId, Array.from(files));
      await loadPhotos();
    } catch (err) {
      setError((err as Error).message || "Failed to upload photos.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-steel2">Photos</p>
        {editable && (
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs font-medium text-amberDark hover:underline disabled:opacity-50"
          >
            <ImagePlus className="h-3.5 w-3.5" /> {uploading ? "Uploading…" : "Add photos"}
          </button>
        )}
        {editable && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        )}
      </div>

      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-steel">Loading photos…</p>
      ) : photoUrls.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-ink/15 py-8 text-center text-steel">
          <ImageOff className="h-6 w-6 text-steel2" />
          <p className="text-sm">No photos yet.</p>
          {editable && (
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="text-sm font-medium text-amberDark hover:underline disabled:opacity-50"
            >
              {uploading ? "Uploading…" : "Upload photos of the aircraft"}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {photoUrls.map((url, idx) => (
            <img key={idx} src={url} alt="" className="aspect-square w-full rounded-lg object-cover" />
          ))}
        </div>
      )}
    </div>
  );
}
