import { Button, Input } from '@open-design/components';
import styles from './InspirePanel.module.css';

export interface RankedInspireTemplate {
  id: string;
  title: string;
  reason?: string;
  category?: string;
}

export interface InspireDesignSystem {
  id: string;
  title: string;
  summary?: string;
  category?: string;
  swatches?: readonly string[];
}

export interface InspireCategory {
  id: string;
  label: string;
}

export interface InspirePanelCopy {
  title: string;
  searchLabel: string;
  searchPlaceholder: string;
  categoriesLabel: string;
  allCategories: string;
  loading: string;
  empty: string;
  rankLabel: string;
  selectTemplate: string;
  selectedTemplate: string;
  templateSectionTitle: string;
  designSystemSectionTitle: string;
  designSystemHint: string;
  noneDesignSystem: string;
  apply: string;
  skip: string;
}

export interface InspirePanelProps {
  rankedTemplates: readonly RankedInspireTemplate[];
  designSystems: readonly InspireDesignSystem[];
  loading: boolean;
  selectedTemplateId: string | null;
  selectedDesignSystemId: string | null;
  searchQuery?: string;
  categories?: readonly InspireCategory[];
  selectedCategory?: string | null;
  onSelect: (id: string | null) => void;
  onSelectDesignSystem: (id: string | null) => void;
  onApply: (templateId: string | null, designSystemId: string | null) => void;
  onSkip: () => void;
  onSearch: (query: string) => void;
  onCategory: (categoryId: string | null) => void;
  copy?: Partial<InspirePanelCopy>;
}

const DEFAULT_COPY: InspirePanelCopy = {
  title: 'Choose inspiration',
  searchLabel: 'Search templates',
  searchPlaceholder: 'Search by style or topic',
  categoriesLabel: 'Template categories',
  allCategories: 'All',
  loading: 'Ranking templates…',
  empty: 'No matching templates found.',
  rankLabel: 'Rank',
  selectTemplate: 'Select',
  selectedTemplate: 'Selected',
  templateSectionTitle: 'Template direction',
  designSystemSectionTitle: 'Design system',
  designSystemHint: 'Combine one system with the template so its tokens and components guide the build.',
  noneDesignSystem: 'No design system',
  apply: 'Use this style',
  skip: 'Use the default style',
};

export function inspireTemplatePreviewUrl(id: string): string {
  return `/api/skills/${encodeURIComponent(id)}/example`;
}

export function InspirePanel({
  rankedTemplates,
  designSystems,
  loading,
  selectedTemplateId,
  selectedDesignSystemId,
  searchQuery = '',
  categories = [],
  selectedCategory = null,
  onSelect,
  onSelectDesignSystem,
  onApply,
  onSkip,
  onSearch,
  onCategory,
  copy: copyOverrides,
}: InspirePanelProps) {
  const copy = { ...DEFAULT_COPY, ...copyOverrides };
  const selectedTemplate =
    selectedTemplateId === null
      ? undefined
      : rankedTemplates.find((template) => template.id === selectedTemplateId);
  const visibleDesignSystems = designSystems.filter((system) => {
    const query = searchQuery.trim().toLocaleLowerCase();
    if (!query) return true;
    return [system.title, system.summary, system.category]
      .filter(Boolean)
      .some((value) => value?.toLocaleLowerCase().includes(query));
  });

  return (
    <section
      className={styles.root}
      aria-label={copy.title}
      aria-busy={loading}
      data-testid={'inspire-panel'}
    >
      <header className={styles.header}>
        <h2 className={styles.title}>{copy.title}</h2>
      </header>

      <label className={styles.searchField}>
        <span className={styles.fieldLabel}>{copy.searchLabel}</span>
        <Input
          type={'search'}
          value={searchQuery}
          placeholder={copy.searchPlaceholder}
          onChange={(event) => onSearch(event.currentTarget.value)}
        />
      </label>

      <section className={styles.choiceSection} aria-label={copy.templateSectionTitle}>
        <div className={styles.sectionHeading}>
          <h3>{copy.templateSectionTitle}</h3>
        </div>

        <div className={styles.categories} aria-label={copy.categoriesLabel}>
          <Button
            variant={selectedCategory === null ? 'primary' : 'subtle'}
            aria-pressed={selectedCategory === null}
            onClick={() => onCategory(null)}
          >
            {copy.allCategories}
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'primary' : 'subtle'}
              aria-pressed={selectedCategory === category.id}
              onClick={() => onCategory(category.id)}
            >
              {category.label}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className={styles.loading} role={'status'}>
            <span>{copy.loading}</span>
            <div className={styles.skeletonGrid} aria-hidden={true}>
              <span />
              <span />
              <span />
            </div>
          </div>
        ) : rankedTemplates.length === 0 ? (
          <div className={styles.empty}>{copy.empty}</div>
        ) : (
          <ol className={styles.grid}>
            {rankedTemplates.map((template, index) => {
              const selected = template.id === selectedTemplateId;
              return (
                <li key={template.id}>
                  <article
                    className={`${styles.card} ${selected ? styles.selected : ''}`}
                    data-template-id={template.id}
                    data-selected={selected ? 'true' : 'false'}
                  >
                    <div className={styles.preview} aria-hidden={true}>
                      <iframe
                        src={inspireTemplatePreviewUrl(template.id)}
                        title={template.title}
                        loading={'lazy'}
                        sandbox={'allow-scripts'}
                        tabIndex={-1}
                      />
                    </div>
                    <div className={styles.cardCopy}>
                      <div className={styles.cardHeading}>
                        <h4 className={styles.templateTitle}>{template.title}</h4>
                        <span className={styles.rank}>
                          {copy.rankLabel} {index + 1}
                        </span>
                      </div>
                      {template.reason ? (
                        <p className={styles.reason}>{template.reason}</p>
                      ) : null}
                      {template.category ? (
                        <span className={styles.category}>{template.category}</span>
                      ) : null}
                    </div>
                    <Button
                      variant={selected ? 'primary' : 'subtle'}
                      className={styles.selectButton}
                      aria-pressed={selected}
                      onClick={() => onSelect(selected ? null : template.id)}
                    >
                      {selected ? copy.selectedTemplate : copy.selectTemplate}
                    </Button>
                  </article>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section className={styles.choiceSection} aria-label={copy.designSystemSectionTitle}>
        <div className={styles.sectionHeading}>
          <div>
            <h3>{copy.designSystemSectionTitle}</h3>
            <p>{copy.designSystemHint}</p>
          </div>
        </div>
        <div className={styles.designSystemGrid}>
          <Button
            variant={selectedDesignSystemId === null ? 'primary' : 'subtle'}
            className={styles.noneDesignSystem}
            aria-pressed={selectedDesignSystemId === null}
            onClick={() => onSelectDesignSystem(null)}
          >
            {copy.noneDesignSystem}
          </Button>
          {visibleDesignSystems.map((system) => {
            const selected = system.id === selectedDesignSystemId;
            return (
              <article
                key={system.id}
                className={`${styles.designSystemCard} ${selected ? styles.selected : ''}`}
                data-design-system-id={system.id}
                data-selected={selected ? 'true' : 'false'}
              >
                <div className={styles.swatches} aria-hidden={true}>
                  {(system.swatches ?? []).slice(0, 5).map((swatch, index) => (
                    <span
                      key={`${swatch}-${index}`}
                      data-swatch={true}
                      style={{ backgroundColor: swatch }}
                    />
                  ))}
                </div>
                <div className={styles.designSystemCopy}>
                  <h4>{system.title}</h4>
                  {system.summary ? <p>{system.summary}</p> : null}
                  {system.category ? <span>{system.category}</span> : null}
                </div>
                <Button
                  variant={selected ? 'primary' : 'subtle'}
                  aria-pressed={selected}
                  onClick={() => onSelectDesignSystem(selected ? null : system.id)}
                >
                  {selected ? copy.selectedTemplate : copy.selectTemplate}
                </Button>
              </article>
            );
          })}
        </div>
      </section>

      <footer className={styles.footer}>
        <Button variant={'ghost'} onClick={onSkip} disabled={loading}>
          {copy.skip}
        </Button>
        <Button
          variant={'primary'}
          disabled={loading || (!selectedTemplate && !selectedDesignSystemId)}
          onClick={() => {
            onApply(selectedTemplate?.id ?? null, selectedDesignSystemId);
          }}
        >
          {copy.apply}
        </Button>
      </footer>
    </section>
  );
}
