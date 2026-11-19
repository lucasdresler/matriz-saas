import { Suspense } from 'react';
import MatrizDashboard from '../page';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function WorkspaceSlugPage({ params }: PageProps) {
  const { slug } = await params;
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', backgroundColor: '#060B18' }} />}>
      <MatrizDashboard initialSlug={slug} />
    </Suspense>
  );
}
