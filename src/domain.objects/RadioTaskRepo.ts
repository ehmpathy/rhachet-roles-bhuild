import { DomainLiteral } from 'domain-objects';

/**
 * .what = target repository for task dispatch
 * .why = identifies which repo owns the task
 */
interface RadioTaskRepo {
  /**
   * repository owner (e.g., "ehmpathy")
   */
  owner: string;

  /**
   * repository name (e.g., "acme-app")
   */
  name: string;
}

class RadioTaskRepo
  extends DomainLiteral<RadioTaskRepo>
  implements RadioTaskRepo {}

export { RadioTaskRepo };
