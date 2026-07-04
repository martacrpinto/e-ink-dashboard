import { Client } from "@notionhq/client";
import { unstable_cache } from "next/cache";
import type { NotionTask, SourceResult } from "./types";

const REVALIDATE = 300;

type NotionPage = {
  id: string;
  url: string;
  properties: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
};

function text(prop: any): string { // eslint-disable-line @typescript-eslint/no-explicit-any
  const parts = prop?.title ?? prop?.rich_text ?? [];
  return parts.map((t: { plain_text: string }) => t.plain_text).join("");
}

type NotionFilter = Parameters<Client["dataSources"]["query"]>[0]["filter"];

async function queryAll(dataSourceId: string, filter?: NotionFilter): Promise<NotionPage[]> {
  const notion = new Client({ auth: process.env.NOTION_TOKEN });
  const pages: NotionPage[] = [];
  let cursor: string | undefined;
  do {
    const res = await notion.dataSources.query({
      data_source_id: dataSourceId,
      start_cursor: cursor,
      page_size: 100,
      ...(filter ? { filter } : {}),
    });
    pages.push(...(res.results as unknown as NotionPage[]));
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return pages;
}

const fetchAdhocTasks = unstable_cache(
  async (dataSourceId: string): Promise<NotionTask[]> => {
    const pages = await queryAll(dataSourceId, {
      property: "Status",
      status: { does_not_equal: "Done" },
    });
    return pages.map((p) => {
      const props = p.properties;
      return {
        id: p.id,
        url: p.url,
        title: text(props["Task name"]) || "(sem título)",
        status: props["Status"]?.status?.name ?? "Not started",
        due: props["Due"]?.date?.start ?? null,
        doToday: props["Do Today"]?.checkbox ?? false,
        buckets: (props["Bucket"]?.multi_select ?? []).map((o: { name: string }) => o.name),
        priority: props["Priority"]?.select?.name ?? null,
        urgency: props["Urgency"]?.select?.name ?? null,
        recurring: props["Recouring"]?.checkbox ?? false,
        days: (props["Days"]?.multi_select ?? []).map((o: { name: string }) => o.name),
      };
    });
  },
  ["notion-adhoc"],
  { revalidate: REVALIDATE, tags: ["notion"] },
);

const fetchWorkTasks = unstable_cache(
  async (dataSourceId: string): Promise<NotionTask[]> => {
    const pages = await queryAll(dataSourceId, {
      property: "Status Update",
      status: { does_not_equal: "Done" },
    });
    return pages.map((p) => {
      const props = p.properties;
      return {
        id: p.id,
        url: p.url,
        title: text(props["Name"]) || "(sem título)",
        status: props["Status Update"]?.status?.name ?? "Not started",
        due: props["Due Date"]?.date?.start ?? null,
      };
    });
  },
  ["notion-work"],
  { revalidate: REVALIDATE, tags: ["notion"] },
);

async function getTasks(
  envVar: "NOTION_ADHOC_DATA_SOURCE_ID" | "NOTION_WORK_DATA_SOURCE_ID",
  fetcher: (id: string) => Promise<NotionTask[]>,
): Promise<SourceResult<NotionTask[]>> {
  const dataSourceId = process.env[envVar];
  if (!process.env.NOTION_TOKEN || !dataSourceId) {
    return { status: "unconfigured", hint: `Define NOTION_TOKEN e ${envVar}` };
  }
  try {
    return { status: "ok", data: await fetcher(dataSourceId) };
  } catch (e) {
    return { status: "error", message: e instanceof Error ? e.message : String(e) };
  }
}

export function getAdhocTasks() {
  return getTasks("NOTION_ADHOC_DATA_SOURCE_ID", fetchAdhocTasks);
}

export function getWorkTasks() {
  return getTasks("NOTION_WORK_DATA_SOURCE_ID", fetchWorkTasks);
}
