import { useId, useState, type ComponentType } from 'react';
import { Link } from 'react-router-dom';
import { Disclaimer } from '../components/Disclaimer';
import { PageHero } from '../components/PageHero';
import { readQuery, useSyncQuery } from '../hooks/useQueryState';
import { useI18n } from '../i18n/context';
import { Rich } from '../i18n/Rich';
import { COMPARE_WIDTHS, compareFromQuery, compareToQuery, embedSrc, type CompareState } from './compare';
import { SCREENS, VARIANT_IDS, variantRouteId, type VariantId } from './registry';
import * as V1 from './v1';
import * as V2 from './v2';
import * as V3 from './v3';
import * as V4 from './v4';
import * as V5 from './v5';
import './gallery.css';
import './shared/variants.css';

const THUMBS: Record<VariantId, ComponentType> = { v1: V1.Thumb, v2: V2.Thumb, v3: V3.Thumb, v4: V4.Thumb, v5: V5.Thumb };

/** Gallery of the design variants: one card per direction, links to its 3 screens, and a side-by-side compare. */
export default function GalleryPage() {
  const { t, path } = useI18n();
  const v = t.variants;
  const g = v.gallery;
  return (
    <div className="vx-root vg-root">
      <div className="vx-banner" role="note" aria-label={v.banner.aria}>
        <div className="vx-banner-inner">
          <p className="vx-banner-text">
            <span className="vx-banner-tag">{v.banner.tag}</span>
            <span className="vx-banner-note">{v.fictional}</span>
          </p>
        </div>
      </div>
      <PageHero eyebrow={g.eyebrow} title={<Rich text={g.title} />}>
        <p>{g.lead}</p>
        <p>
          <Link to={path('matchGuidedDemo')} className="btn btn-gold">
            {t.guidedDemo.galleryLink} <span aria-hidden="true">→</span>
          </Link>
        </p>
      </PageHero>

      <section className="vg-section" aria-label={g.eyebrow}>
        <ul className="vg-grid">
          {VARIANT_IDS.map((id) => {
            const info = v.variants[id];
            const Thumb = THUMBS[id];
            return (
              <li key={id} className="vg-card">
                <Link to={path(variantRouteId(id, 'landing'))} className="vg-thumb" aria-label={g.preview(info.name)}>
                  <Thumb />
                </Link>
                <div className="vg-card-body">
                  <p className="vg-code">{id.toUpperCase()}</p>
                  <h2 className="vg-name">{info.name}</h2>
                  <p className="vg-tagline">{info.tagline}</p>
                  <p className="vg-desc">{info.description}</p>
                  <div className="vg-procon">
                    <div>
                      <h3>{g.pros}</h3>
                      <ul>
                        {info.pros.map((p) => (
                          <li key={p}>{p}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3>{g.cons}</h3>
                      <ul>
                        {info.cons.map((c) => (
                          <li key={c}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <nav aria-label={`${g.screensLabel}: ${info.name}`}>
                    <ul className="vg-links">
                      {SCREENS.map((s) => (
                        <li key={s}>
                          <Link to={path(variantRouteId(id, s))}>
                            {v.screens[s]} <span aria-hidden="true">→</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <Compare />

      <section className="vg-section vg-decision" aria-labelledby="vg-decision-title">
        <h2 id="vg-decision-title">{g.decisionTitle}</h2>
        <p>{g.decisionText}</p>
        <p className="vg-ask">{g.decisionAsk}</p>
      </section>

      <div className="vg-section">
        <p className="vg-fictional">{v.fictional}</p>
        <Disclaimer />
      </div>
    </div>
  );
}

function Compare() {
  const { t, path } = useI18n();
  const v = t.variants;
  const g = v.gallery;
  const id = useId();
  const [state, setState] = useState<CompareState>(() => compareFromQuery(readQuery()));
  useSyncQuery(compareToQuery(state));
  const set = (patch: Partial<CompareState>) => setState((s) => ({ ...s, ...patch }));
  const sides = [
    { key: 'left', label: g.left, value: state.left },
    { key: 'right', label: g.right, value: state.right },
  ] as const;

  return (
    <section className="vg-section vg-compare" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>{g.compareTitle}</h2>
      <p className="vg-lead">{g.compareLead}</p>
      <div className="vg-controls">
        {sides.map((side) => (
          <div className="vg-control" key={side.key}>
            <label htmlFor={`${id}-${side.key}`}>{side.label}</label>
            <select id={`${id}-${side.key}`} value={side.value} onChange={(e) => set({ [side.key]: e.target.value as VariantId })}>
              {VARIANT_IDS.map((vid) => (
                <option key={vid} value={vid}>
                  {vid.toUpperCase()} · {v.variants[vid].name}
                </option>
              ))}
            </select>
          </div>
        ))}
        <div className="vg-control">
          <label htmlFor={`${id}-screen`}>{g.screen}</label>
          <select id={`${id}-screen`} value={state.screen} onChange={(e) => set({ screen: e.target.value as CompareState['screen'] })}>
            {SCREENS.map((s) => (
              <option key={s} value={s}>
                {v.screens[s]}
              </option>
            ))}
          </select>
        </div>
        <fieldset className="vg-control vg-widths">
          <legend>{g.width}</legend>
          {COMPARE_WIDTHS.map((w) => (
            <label key={w}>
              <input type="radio" name={`${id}-width`} value={w} checked={state.width === w} onChange={() => set({ width: w })} />
              {g.widths[w]}
            </label>
          ))}
        </fieldset>
      </div>
      <div className={`vg-panes vg-panes-${state.width}`}>
        {sides.map((side) => {
          const routeId = variantRouteId(side.value, state.screen);
          const title = g.frameTitle(v.variants[side.value].name, v.screens[state.screen]);
          return (
            <figure className="vg-pane" key={side.key}>
              <figcaption>
                <span>
                  {side.value.toUpperCase()} · {v.variants[side.value].name}
                </span>
                <Link to={path(routeId)}>{g.openFull}</Link>
              </figcaption>
              <div className="vg-frame">
                <iframe key={`${routeId}-${side.key}`} src={embedSrc(import.meta.env.BASE_URL, path(routeId))} title={title} />
              </div>
            </figure>
          );
        })}
      </div>
    </section>
  );
}
