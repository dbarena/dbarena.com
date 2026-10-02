import { type ComponentProps, useId } from "react";

import { type ColumnProvider } from "@/lib/catalog";
import { cn } from "@/lib/utils";

type ProviderLogoProps = ComponentProps<"svg"> & {
  monochrome?: boolean;
  provider: ColumnProvider;
};

function AmazonRdsLogo({ className, monochrome = false, ...props }: ComponentProps<"svg"> & { monochrome?: boolean }) {
  const gradientId = useId();

  return (
    <svg
      aria-hidden="true"
      className={cn("shrink-0", className)}
      fill="none"
      focusable="false"
      height="18"
      viewBox="0 0 80 80"
      width="18"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {monochrome ? (
        <>
          <ellipse cx="40" cy="21" rx="22" ry="9" stroke="currentColor" strokeWidth="5" />
          <path
            d="M18 21v37c0 5 9.85 9 22 9s22-4 22-9V21M18 39c0 5 9.85 9 22 9s22-4 22-9"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="5"
          />
        </>
      ) : (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0" x2="1" y1="1" y2="0">
              <stop offset="0" stopColor="#2E27AD" />
              <stop offset="1" stopColor="#527FFF" />
            </linearGradient>
          </defs>
          <rect fill={`url(#${gradientId})`} height="80" rx="8" width="80" />
          <path
            d="M15.414 14 24.707 23.293 23.293 24.707 14 15.414V23h-2V13c0-.552.447-1 1-1h10v2h-7.586ZM68 13v10h-2v-7.586l-9.293 9.293-1.414-1.414L64.586 14H57v-2h10c.553 0 1 .448 1 1Zm-2 44h2v10c0 .552-.447 1-1 1H57v-2h7.586l-9.293-9.293 1.414-1.414L66 64.586V57Zm-.5-17.787c0-3.319-3.832-6.598-10.25-8.771l.641-1.894C63.268 31.045 67.5 34.932 67.5 39.213c0 4.282-4.232 8.17-11.61 10.666l-.641-1.895C61.668 45.812 65.5 42.534 65.5 39.213Zm-50.944 0c0 3.18 3.587 6.372 9.596 8.54l-.679 1.881c-6.938-2.503-10.917-6.301-10.917-10.421 0-4.119 3.979-7.917 10.917-10.421l.679 1.881c-6.009 2.169-9.596 5.361-9.596 8.54Zm10.151 17.494L15.414 66H23v2H13c-.553 0-1-.448-1-1V57h2v7.586l-9.293-9.293 1.414 1.414ZM40 31.286c-7.146 0-11-1.846-11-2.6 0-.755 3.854-2.6 11-2.6 7.145 0 11 1.845 11 2.6 0 .754-3.855 2.6-11 2.6Zm.029 7.745C33.187 39.031 29 37.162 29 36.145v-4.861c2.463 1.359 6.832 2.002 11 2.002s8.537-.643 11-2.002v4.861c0 1.018-4.165 2.886-10.971 2.886Zm0 7.636C33.187 46.667 29 44.798 29 43.781v-4.919c2.431 1.429 6.742 2.169 11.029 2.169 4.263 0 8.549-.739 10.971-2.164v4.914c0 1.018-4.165 2.886-10.971 2.886ZM40 53.518c-7.117 0-11-1.913-11-2.896v-4.124c2.431 1.429 6.742 2.169 11.029 2.169 4.263 0 8.549-.738 10.971-2.164v4.119c0 .983-3.883 2.896-11 2.896Zm0-29.432c-6.261 0-13 1.439-13 4.6v21.936c0 3.214 6.54 4.896 13 4.896s13-1.682 13-4.896V28.686c0-3.161-6.739-4.6-13-4.6Z"
            fill="white"
          />
        </>
      )}
    </svg>
  );
}

function SupabaseLogo({ className, monochrome = false, ...props }: ComponentProps<"svg"> & { monochrome?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={cn("shrink-0", className)}
      fill="none"
      focusable="false"
      height="18"
      viewBox="0 0 24 24"
      width="18"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M11.9 1.036c-.015-.986-1.26-1.41-1.874-.637L.764 12.05C-.33 13.427.65 15.455 2.409 15.455h9.579l.113 7.51c.014.985 1.259 1.408 1.873.636l9.262-11.653c1.093-1.375.113-3.403-1.645-3.403h-9.642L11.9 1.036Z"
        fill={monochrome ? "currentColor" : "#3FCF8E"}
      />
    </svg>
  );
}

function GoogleCloudSqlLogo({ className, monochrome = false, ...props }: ComponentProps<"svg"> & { monochrome?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={cn("shrink-0", className)}
      fill="none"
      focusable="false"
      height="18"
      viewBox="0 0 24 24"
      width="18"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M7.5 18.5h9.1a4.4 4.4 0 0 0 .7-8.74A6.2 6.2 0 0 0 5.55 8.2 5.18 5.18 0 0 0 7.5 18.5Z"
        fill={monochrome ? "currentColor" : "#4285F4"}
      />
      <path d="M5.08 15.9A5.15 5.15 0 0 1 5.55 8.2" stroke={monochrome ? "currentColor" : "#34A853"} strokeWidth="2.6" />
      <path d="M5.55 8.2A6.2 6.2 0 0 1 10.8 5.5" stroke={monochrome ? "currentColor" : "#FBBC04"} strokeWidth="2.6" />
      <path d="M10.8 5.5a6.2 6.2 0 0 1 5.88 4.05" stroke={monochrome ? "currentColor" : "#EA4335"} strokeWidth="2.6" />
      {!monochrome ? <path d="M9 12.2h6M9 14.9h6" stroke="white" strokeLinecap="round" strokeWidth="1.25" /> : null}
    </svg>
  );
}

export function ProviderLogo({ monochrome = false, provider, ...props }: ProviderLogoProps) {
  const kind = logoKind(provider);
  switch (kind) {
    case "rds":
      return <AmazonRdsLogo monochrome={monochrome} {...props} />;
    case "gcp":
      return <GoogleCloudSqlLogo monochrome={monochrome} {...props} />;
    case "supabase":
      return <SupabaseLogo monochrome={monochrome} {...props} />;
    case "generic":
      return <GenericProviderLogo provider={provider} {...props} />;
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}

function logoKind(provider: ColumnProvider) {
  switch (provider) {
    case "aws":
    case "rds":
    case "amazon-rds":
      return "rds" as const;
    case "gcp":
    case "gcp-cloudsql":
    case "cloud-sql-for-postgres":
      return "gcp" as const;
    case "supabase":
    case "orioledb":
      return "supabase" as const;
    default:
      return "generic" as const;
  }
}

function GenericProviderLogo({
  className,
  provider,
  ...props
}: ComponentProps<"svg"> & { provider: string }) {
  const letter = provider.charAt(0).toUpperCase() || "?";
  return (
    <svg
      aria-hidden="true"
      className={cn("shrink-0", className)}
      fill="none"
      focusable="false"
      height="18"
      viewBox="0 0 24 24"
      width="18"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect fill="currentColor" fillOpacity="0.16" height="24" rx="4" width="24" />
      <text
        dominantBaseline="central"
        fill="currentColor"
        fontSize="12"
        fontWeight="700"
        textAnchor="middle"
        x="12"
        y="13"
      >
        {letter}
      </text>
    </svg>
  );
}
