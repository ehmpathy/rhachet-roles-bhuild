.tactic = name:nounadj-namespace

.what = enforce $noun.$adj namespace ordering for domain objects to maximize autocomplete-ability, alphasort, and symmetry

.scope
- applies to all domain object names (entities, literals, events)
- BLOCKER level violation when detected

.why
- **autocomplete-ability**: grouping by noun prefix enables IDE autocomplete to show all variants
  - typing `Invoice` shows: InvoiceDraft, InvoiceFinal, InvoiceLineItem, etc.
  - typing `Customer` shows: CustomerContact, CustomerAddress, CustomerPreferences
- **alphasort**: noun-first ordering naturally groups related objects in file explorers and exports
  - all Invoice* files sort together
  - all Customer* files sort together
- **symmetry**: consistent pattern across all domain objects reduces cognitive load
  - no need to remember if it's DraftInvoice or InvoiceDraft
  - pattern is always: $noun followed by $adj or $qualifier

.pattern
```
$RootNoun                        // the core domain concept
$RootNoun$Qualifier              // a qualified variant of the root
$RootNoun$SubNoun                // a child concept under the root
  $RootNoun$SubNoun$Qualifier    // a qualified variant of the child
```

.hierarchy.example
```
Invoice                  // root noun
InvoiceDraft             // invoice + draft (state qualifier)
InvoiceFinal             // invoice + final (state qualifier)
InvoiceLineItem          // invoice + lineitem (child concept)
  InvoiceLineItemTaxable     // lineitem + taxable (qualifier)
  InvoiceLineItemExempt      // lineitem + exempt (qualifier)
InvoicePayment           // invoice + payment (related concept)
  InvoicePaymentPending      // payment + pending (state)
  InvoicePaymentCompleted    // payment + completed (state)
```

.detect
- domain object names with adjective-first ordering (e.g., DraftInvoice, PendingPayment)
- inconsistent prefixes within the same domain (e.g., mixing Payment and InvoicePayment)
- qualifier before noun (e.g., TaxableLineItem instead of InvoiceLineItemTaxable)
- orphaned qualifiers without namespace (e.g., DraftState instead of InvoiceDraft)

.fix
- reorder to $noun.$adj pattern
- use consistent noun prefix for related objects
- nest qualifiers hierarchically (Root → RootChild → RootChildQualifier)

.examples

.negative (wrong order)
```ts
class DraftInvoice {}            // ⛔ adjective-first
class PendingPayment {}          // ⛔ adjective-first
class ActiveSubscription {}      // ⛔ adjective-first
class TaxableItem {}             // ⛔ qualifier without namespace
class CompletedOrder {}          // ⛔ orphaned from parent
```

.positive (noun-first)
```ts
class InvoiceDraft {}            // ✅ noun-first
class InvoicePaymentPending {}   // ✅ hierarchical namespace
class SubscriptionActive {}      // ✅ noun-first
class OrderLineItemTaxable {}    // ✅ nested qualifier
class OrderCompleted {}          // ✅ noun-first state
```

.benefit
- discoverability via autocomplete
- natural grouping in file system
- consistent mental model
- reduced naming decisions (pattern is deterministic)
