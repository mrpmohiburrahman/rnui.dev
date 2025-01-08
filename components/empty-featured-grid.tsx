import Link from "next/link"

export const EmptyFeaturedGrid = () => {
  const emptyData = [
    {
      codename: "Join the cult",
      punchline: "Next.j, Supabase & Tailwind Starters",
      product_website: "https://newcult.co",
      description:
        "Check out newcult.co for the premium version of this template",
      logo_src: "/ad-placeholder-metrics.png",
      tags: ["featured"],
      labels: ["featured-ad"],
    },
    {
      codename: "To get Admin Dashboard",
      product_website: "https://newcult.co",
      punchline: "Next.j, Supabase & Tailwind Starters",
      description:
        "Join the cult and get access to the admin dashboard for this template.",
      logo_src: "/ad-placeholder-1.png",
      tags: ["featured"],
      labels: ["featured-ad"],
    },
    {
      codename: "And AI scripts",
      product_website: "https://newcult.co",
      punchline: "Next.j, Supabase & Tailwind Starters",
      description:
        "Includes AI scripts to quickly add new products to your directory..",
      logo_src: "/ad-placeholder-tags.png",
      tags: ["featured"],
      labels: ["featured-ad"],
    },
  ]

  return (
    <div className="w-full mx-auto max-w-7xl  bg-black/20 dark:bg-neutral-950/40 border border-dashed border-black/10 py-3 px-3 rounded-[1.9rem]">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {/* {emptyData.map((data, index) => (
          <Link
            href="https://newcult.co"
            target="_blank"
            rel="noreferrer noopener"
            key={`featured-${index}-${data.codename}`}
            className="md:py-0 "
          >
            <ResourceCard trim={true} data={data} order={index} />
          </Link>
        ))} */}
      </div>
    </div>
  )
}
