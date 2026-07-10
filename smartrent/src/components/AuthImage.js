import { useEffect, useState } from "react";
import { fetchBlob } from "../api/client";

// Uploaded photos require the Authorization header, so a plain <img src>
// won't work — fetch the blob and render it as an object URL instead.
export default function AuthImage({ src, alt, className, fallback }) {
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl;
    let cancelled = false;
    setFailed(false);
    setUrl(null);

    fetchBlob(src)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (failed || !url) return fallback || null;
  return <img src={url} alt={alt} className={className} />;
}
