import ModelProfileClient from "./model-profile-client";

interface PageProps {
  params: Promise<{
    modelId: string;
  }>;
}

export default async function ModelProfilePage({ params }: PageProps) {
  // Await params as they are now async in Next.js 15
  const { modelId } = await params;
  // Decode the modelId in case it's URL encoded
  const decodedModelId = decodeURIComponent(modelId);
  return <ModelProfileClient modelId={decodedModelId} />;
}
