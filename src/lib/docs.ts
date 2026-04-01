import { getCollection, type CollectionEntry } from "astro:content";

export type DocEntry = CollectionEntry<"docs">;

export type SidebarLeaf = {
  label: string;
  href: string;
  current: boolean;
};

export type SidebarTopic = {
  label: string;
  slug: string;
  href: string;
  current: boolean;
  open: boolean;
  pages: SidebarLeaf[];
};

export type SidebarMacro = {
  label: string;
  slug: string;
  href: string;
  current: boolean;
  open: boolean;
  topics: SidebarTopic[];
};

export function getDocSlug(entry: DocEntry) {
  return entry.slug ?? entry.id.replace(/\.(md|mdx)$/i, "");
}

export async function getSortedDocs() {
  const docs = await getCollection("docs", ({ data }) => !data.draft);

  return docs.sort((left, right) => {
    const leftOrder = left.data.order ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = right.data.order ?? Number.MAX_SAFE_INTEGER;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return getDocSlug(left).localeCompare(getDocSlug(right));
  });
}

export function getDocTitle(entry: DocEntry) {
  const slug = getDocSlug(entry);
  return entry.data.title ?? humanizeSlug(slug.split("/").at(-1) ?? slug);
}

export function getDocDescription(entry: DocEntry) {
  return entry.data.description ?? `Notes for ${getDocTitle(entry).toLowerCase()}.`;
}

export function getDocHref(entry: DocEntry) {
  return `/docs/${getDocSlug(entry)}/`;
}

export function buildSidebar(docs: DocEntry[], currentSlug?: string) {
  const macros = new Map<string, SidebarMacro>();

  for (const entry of docs) {
    const slug = getDocSlug(entry);
    const parts = slug.split("/");
    const isCurrent = slug === currentSlug;

    if (parts.length === 1) {
      const rootKey = "root";
      const rootNode = macros.get(rootKey) ?? {
        label: "General",
        slug: rootKey,
        href: "/",
        current: false,
        open: false,
        topics: []
      };

      const generalTopic = rootNode.topics[0] ?? {
        label: "Overview",
        slug: "overview",
        href: "/",
        current: false,
        open: false,
        pages: []
      };

      generalTopic.pages.push({
        label: getDocTitle(entry),
        href: getDocHref(entry),
        current: isCurrent
      });
      generalTopic.current = generalTopic.current || isCurrent;
      generalTopic.open = generalTopic.open || isCurrent;
      rootNode.topics = [generalTopic];
      rootNode.current = rootNode.current || isCurrent;
      rootNode.open = rootNode.open || isCurrent;
      macros.set(rootKey, rootNode);
      continue;
    }

    const macroSlug = parts[0];
    const topicSlug = parts[1] ?? parts[0];
    const macroHref = `/docs/${macroSlug}/00-overview/`;
    const topicHref = `/docs/${macroSlug}/${topicSlug}/00-overview/`;

    const macroNode = macros.get(macroSlug) ?? {
      label: humanizeSlug(macroSlug),
      slug: macroSlug,
      href: macroHref,
      current: false,
      open: false,
      topics: []
    };

    let topicNode = macroNode.topics.find((topic) => topic.slug === topicSlug);
    if (!topicNode) {
      topicNode = {
        label: humanizeSlug(topicSlug),
        slug: topicSlug,
        href: topicHref,
        current: false,
        open: false,
        pages: []
      };
      macroNode.topics.push(topicNode);
    }

    const isTopicOverview = parts.length === 3 && parts[2] === "00-overview";
    const isMacroOverview = parts.length === 2 && parts[1] === "00-overview";

    if (!isTopicOverview && !isMacroOverview) {
      topicNode.pages.push({
        label: getDocTitle(entry),
        href: getDocHref(entry),
        current: isCurrent
      });
    }

    topicNode.current = topicNode.current || isCurrent || isTopicOverview;
    topicNode.open = topicNode.open || isCurrent;
    macroNode.current = macroNode.current || isCurrent || isMacroOverview;
    macroNode.open = macroNode.open || isCurrent || isMacroOverview;

    macros.set(macroSlug, macroNode);
  }

  return Array.from(macros.values()).sort((left, right) => left.label.localeCompare(right.label));
}

function humanizeSlug(value: string) {
  return value
    .replace(/^\d+[-_]?/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
