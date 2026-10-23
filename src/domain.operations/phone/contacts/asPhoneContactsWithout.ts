/**
 * .what = the contacts left once every given form is removed
 */
export const asPhoneContactsWithout = (input: {
  contacts: string[];
  forms: string[];
}): string[] =>
  input.contacts.filter((contact) => !input.forms.includes(contact));
