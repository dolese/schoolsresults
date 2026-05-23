type ManagedSchool = {
  role: string;
  school: {
    id: string;
    slug: string;
    name: string;
    status: string;
  };
};

export type MySchoolsResponse = {
  isSuperAdmin: boolean;
  schools: ManagedSchool[];
};

export function getPostLoginPath(data: MySchoolsResponse): string {
  if (data.schools.length === 1) {
    return `/manage/${data.schools[0].school.slug}`;
  }

  if (data.schools.length === 0 && data.isSuperAdmin) {
    return "/super";
  }

  return "/app";
}

export function normalizeInternalRedirect(raw?: string): string | null {
  if (!raw) return null;

  if (raw.startsWith("/")) {
    return raw;
  }

  if (typeof window === "undefined") {
    return null;
  }

  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
