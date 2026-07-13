import { Button, Input } from '@open-design/components';
import styles from './InspirePanel.module.css';

export interface RankedInspireTemplate {
  id: string;
  title: string;
  reason?: string;
  category?: string;
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
  apply: string;
  skip: string;
}

export interface InspirePanelProps {
  rankedTemplates: readonly RankedInspireTemplate[];
  loading: boolean;
  selectedId: string | null;
  searchQuery?: string;
  categories?: readonly InspireCategory[];
  selectedCategory?: string | null;
  onSelect: (id: string) => void;
  onApply: (id: string) => void;
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
  apply: 'Use this style',
  skip: 'Use the default style',
};

export function inspireTemplatePreviewUrl(id: string): string {
  return `/api/skills/${encodeURIComponent(id)}/example`;
}

export function InspirePanel({
  rankedTemplates,
  loading,
  selectedId,
  searchQuery = '',
  categories = [],
  selectedCategory = null,
  onSelect,
  onApply,
  onSkip,
  onSearch,
  onCategory,
  copy: copyOverrides,
}: InspirePanelProps) {
  const copy = { ...DEFAULT_COPY, ...copyOverrides };
  const selectedTemplate =
    selectedId === null
      ? undefined
      : rankedTemplates.find((template) => template.id === selectedId);

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
            const selected = template.id === selectedId;
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
                      <h3 className={styles.templateTitle}>{template.title}</h3>
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
                    onClick={() => onSelect(template.id)}
                  >
                    {selected ? copy.selectedTemplate : copy.selectTemplate}
                  </Button>
                </article>
              </li>
            );
          })}
        </ol>
      )}

      <footer className={styles.footer}>
        <Button variant={'ghost'} onClick={onSkip} disabled={loading}>
          {copy.skip}
        </Button>
        <Button
          variant={'primary'}
          disabled={loading || !selectedTemplate}
          onClick={() => {
            if (selectedTemplate) onApply(selectedTemplate.id);
          }}
        >
          {copy.apply}
        </Button>
      </footer>
    </section>
  );
}
