export type PexelsPhoto = {
  src: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
  pageUrl: string;
};

const FALLBACK_PHOTO: PexelsPhoto = {
  src: "https://images.pexels.com/photos/2438213/pexels-photo-2438213.jpeg?auto=compress&cs=tinysrgb&w=1600",
  alt: "Black and white abstract view of a spiral staircase in Nuremberg, Germany.",
  photographer: "Robin Schreiner",
  photographerUrl: "https://www.pexels.com/@robin-schreiner-1188739",
  pageUrl:
    "https://www.pexels.com/photo/modern-architectural-design-2438213/",
};

/**
 * Fetch the single editorial photograph used on the auth screen from Pexels.
 * The page still renders if the API key is absent or the request fails.
 */
export async function getAuthPhoto(): Promise<PexelsPhoto> {
  const key =
    process.env.PEXELS_API_KEY || process.env.NEXT_PUBLIC_PEXELS_API_KEY;

  if (!key) return FALLBACK_PHOTO;

  try {
    const response = await fetch("https://api.pexels.com/v1/photos/2438213", {
      headers: { Authorization: key },
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!response.ok) return FALLBACK_PHOTO;

    const photo = (await response.json()) as {
      src?: { large2x?: string; original?: string };
      alt?: string;
      photographer?: string;
      photographer_url?: string;
      url?: string;
    };

    const src = photo.src?.large2x || photo.src?.original;
    if (!src) return FALLBACK_PHOTO;

    return {
      src,
      alt: photo.alt || FALLBACK_PHOTO.alt,
      photographer: photo.photographer || FALLBACK_PHOTO.photographer,
      photographerUrl:
        photo.photographer_url || FALLBACK_PHOTO.photographerUrl,
      pageUrl: photo.url || FALLBACK_PHOTO.pageUrl,
    };
  } catch (error) {
    console.error("[pexels] Could not load the auth photograph:", error);
    return FALLBACK_PHOTO;
  }
}
