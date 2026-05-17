// Probe endpoint — used to verify which build is actually deployed.
// Hit /api/build-probe and you'll see the marker string. If the marker
// matches the version below, the deployed binary is current.
export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json({
    version: 'v9-distdir-bypass',
    deployedAt: new Date().toISOString(),
    hasMiddleware: false,
  });
}
