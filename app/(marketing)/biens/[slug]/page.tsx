import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/property/Breadcrumb";
import PropertyGallery from "@/components/property/PropertyGallery";
import PropertyHeader from "@/components/property/PropertyHeader";
import PropertyFacts from "@/components/property/PropertyFacts";
import PropertyAmenities from "@/components/property/PropertyAmenities";
import PropertyLocationBlock from "@/components/property/PropertyLocationBlock";
import PropertyDocuments from "@/components/property/PropertyDocuments";
import ContactSidebar from "@/components/property/ContactSidebar";
import SimilarProperties from "@/components/property/SimilarProperties";
import { getPropertyGallery } from "@/lib/property-gallery";
import { propertyTypeLabels } from "@/lib/properties";
import { getPublicPropertyBySlug } from "@/lib/public-catalog/queries";

export async function generateMetadata({
  params,
}: PageProps<"/biens/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const property = await getPublicPropertyBySlug(slug);
  if (!property) notFound();

  const discreet = property.visibility.isOffMarket;

  return {
    title: property.seo.title.fr,
    description: property.seo.description.fr,
    robots: discreet ? { index: false, follow: false } : undefined,
    alternates: { canonical: `/biens/${property.slug}` },
    openGraph: {
      title: property.seo.title.fr,
      description: property.seo.description.fr,
    },
  };
}

export default async function PropertyPage({ params }: PageProps<"/biens/[slug]">) {
  const { slug } = await params;
  const property = await getPublicPropertyBySlug(slug);
  if (!property) notFound();

  const discreet = property.visibility.isOffMarket;
  const gallery = getPropertyGallery(property);
  const typeLabel = propertyTypeLabels[property.type];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-12 px-6 py-10 lg:px-8 lg:py-14">
      <Breadcrumb
        items={[
          { label: "Accueil", href: "/" },
          { label: "Explorer", href: "/explorer" },
          { label: property.location.city, href: `/explorer?ville=${encodeURIComponent(property.location.city)}` },
          { label: typeLabel, href: `/explorer?type=${encodeURIComponent(property.type)}` },
        ]}
      />

      <PropertyGallery
        title={property.title.fr}
        photos={gallery.photos}
        video={gallery.video}
        virtualTour={gallery.virtualTour}
      />

      <div className="grid gap-12 lg:grid-cols-[2fr_1fr] lg:items-start">
        <div className="flex flex-col gap-12">
          <PropertyHeader property={property} discreet={discreet} />

          <section className="flex flex-col gap-4">
            <h2 className="font-display text-2xl font-semibold text-anthracite-950">Description</h2>
            <p className="whitespace-pre-line text-base leading-relaxed text-anthracite-600">
              {property.description.fr}
            </p>
          </section>

          <PropertyFacts property={property} />
          <PropertyAmenities property={property} />
          <PropertyLocationBlock property={property} discreet={discreet} />
          <PropertyDocuments property={property} />
        </div>

        <ContactSidebar
          agentId={property.agentId}
          propertyTitle={property.title.fr}
          propertyReference={property.reference}
        />
      </div>

      <SimilarProperties property={property} />
    </div>
  );
}
