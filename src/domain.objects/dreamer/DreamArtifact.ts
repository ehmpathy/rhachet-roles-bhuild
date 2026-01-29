import { DomainLiteral } from 'domain-objects';

/**
 * date stamp in YYYY_MM_DD format
 * e.g., "2026_01_27"
 *
 * .note = uses underscores to match .behavior/ folder convention
 */
type DreamDateStamp = string;

/**
 * .what = a persisted dream in the .dream/ folder
 * .why = provides identity and date info for dream resolution
 */
interface DreamArtifact {
  /**
   * full path to the artifact file
   * e.g., ".dream/2026_01_27.config-reload.dream.md"
   */
  path: string;

  /**
   * the normalized dream name extracted from filename
   * e.g., "config-reload"
   */
  name: string;

  /**
   * the date when this dream was first captured
   * format: YYYY_MM_DD
   * e.g., "2026_01_27"
   */
  date: DreamDateStamp;

  /**
   * the base filename without path
   * e.g., "2026_01_27.config-reload.dream.md"
   */
  filename: string;
}
class DreamArtifact
  extends DomainLiteral<DreamArtifact>
  implements DreamArtifact
{
  public static primary = ['path'] as const;
  public static unique = ['path'] as const;
}

export { DreamArtifact };
