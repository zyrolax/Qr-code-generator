import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api.js";
import { Button, Card } from "../components/ui.jsx";
import { BlockView, BlockList, FinderForm, PageShell, ContentCard } from "../blocks/BlockView.jsx";

// The public page a finder lands on after scanning. Chrome-free (no Nav).
// Renders differently per sticker status. NEVER shows owner contact.
export default function Scan() {
  const { code } = useParams();
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    api
      .get(`/q/${code}`)
      .then((data) => setState({ loading: false, data }))
      .catch((err) => setState({ loading: false, error: err.message }));
  }, [code]);

  if (state.loading) return <Centered>Loading…</Centered>;
  if (state.error) return <Centered>This sticker could not be found.</Centered>;

  const { status } = state.data;

  if (status === "unclaimed") {
    return (
      <Centered>
        <Card className="max-w-sm text-center">
          <h1 className="text-xl font-bold">This sticker hasn’t been set up yet</h1>
          <p className="mt-2 text-sm text-gray-600">
            If it’s yours, claim it to activate your page.
          </p>
          <Button as="link" to="/claim" className="mt-4 w-full">
            Claim this sticker
          </Button>
        </Card>
      </Centered>
    );
  }

  if (status === "paused") {
    return (
      <Centered>
        <Card className="max-w-sm text-center">
          <h1 className="text-xl font-bold">This page is not active right now</h1>
          <p className="mt-2 text-sm text-gray-600">Please check back later.</p>
        </Card>
      </Centered>
    );
  }

  // active or lost
  return <OwnerPage code={code} data={state.data} />;
}

function OwnerPage({ code, data }) {
  const { page, template, status } = data;
  const blocks = page?.blocks || [];

  return (
    // The themed page shell paints the background + content card from the
    // owner's chosen theme (page.style), matching the editor canvas exactly.
    <PageShell style={page?.style} className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-md">
        {status === "lost" && (
          <div className="mb-4 animate-pulse rounded-xl bg-red-600 px-4 py-3 text-center font-semibold text-white shadow-lg shadow-red-200">
            🔴 This item is reported lost
          </div>
        )}

        <ContentCard>
          {blocks.length > 0 ? (
            <BlockList blocks={blocks} code={code} interactive />
          ) : (
            <LegacyPage code={code} page={page} template={template} />
          )}
        </ContentCard>

        <p className="mt-6 text-center text-xs" style={{ color: "var(--muted)" }}>
          Powered by{" "}
          <Link to="/" className="font-medium" style={{ color: "var(--accent)" }}>
            Requesto
          </Link>{" "}
          · the owner’s contact is never shown
        </p>
      </div>
    </PageShell>
  );
}

// Fallback rendering for stickers created before the block editor (and seed
// data): render the old fixed fields, then the finder form for lost&found.
function LegacyPage({ code, page, template }) {
  return (
    <>
      {page.imageUrl && (
        <img src={page.imageUrl} alt="" className="mb-4 max-h-56 w-full rounded-2xl object-cover" />
      )}
      <h1 className="text-2xl font-bold">{page.title || "Requesto page"}</h1>
      {page.description && <p className="mt-2 text-gray-700">{page.description}</p>}

      {template === "links" && page.links?.length > 0 && (
        <div className="mt-5 space-y-2">
          {page.links
            .filter((l) => l.url)
            .map((l, i) => (
              <BlockView
                key={i}
                block={{ id: String(i), type: "links", props: { items: [l] } }}
                interactive
              />
            ))}
        </div>
      )}

      {template === "lost_found" && (
        <>
          {page.note && (
            <Card className="mt-5 bg-brand-light/50">
              <p className="text-sm font-medium text-gray-700">A note from the owner</p>
              <p className="mt-1 text-gray-800">{page.note}</p>
            </Card>
          )}
          <div className="mt-6">
            <FinderForm code={code} interactive heading="Found this item?" />
          </div>
        </>
      )}
    </>
  );
}

function Centered({ children }) {
  return <div className="flex min-h-screen items-center justify-center p-4">{children}</div>;
}
