# ref: self-review questions

## .what

curated question bank for self-reviews, drawn from critical evaluation research.

## .sources

### foundational

- [socratic method - wikipedia](https://en.wikipedia.org/wiki/Socratic_questioning)
- [5 whys - wikipedia](https://en.wikipedia.org/wiki/Five_whys)
- [first principles - james clear](https://jamesclear.com/first-principles)
- [first principles - fs.blog](https://fs.blog/first-principles/)

### decision frameworks

- [ladder of inference - hbs](https://online.hbs.edu/blog/post/ladder-of-inference)
- [ladder of inference - asana](https://asana.com/resources/ladder-of-inference)
- [inversion - fs.blog](https://fs.blog/inversion/)
- [inversion - james clear](https://jamesclear.com/inversion)

### team techniques

- [six hats - mindtools](https://www.mindtools.com/ajlpp1e/six-thinking-hats/)
- [red team handbook - army](https://rdl.train.army.mil/catalog-ws/view/arimanagingcomplexproblems/downloads/The_Applied_Critical_Thinking_Handbook_v8.1.pdf)
- [pre-mortem technique - adb](https://www.adb.org/sites/default/files/publication/29658/premortem-technique.pdf)

### engineering

- [musk's 5-step process - aviationweek](https://aviationweek.com/space/commercial-space/algorithm-spacexs-five-step-process-better-engineering)
- [musk's 5-step design - modelthinkers](https://modelthinkers.com/mental-model/musks-5-step-design-process)
- [socratic method for requirements - tigosolutions](https://en.tigosolutions.com/how-to-analyze-software-requirements-like-socrates-7-smart-questions-every-analyst-should-ask-65373)

---

## .techniques

### socratic method

six categories of questions to probe depth:

| category | purpose | example |
|----------|---------|---------|
| clarification | define terms | "what do you mean by X?" |
| assumptions | surface hidden beliefs | "what are we not aware we assume?" |
| evidence | validate claims | "what evidence supports this?" |
| viewpoints | consider alternatives | "what would someone who disagrees say?" |
| implications | trace consequences | "what depends on this?" |
| meta | question the question | "why is this question important?" |

### 5 whys

ask "why?" repeatedly (typically 5 times) to drill from symptom to root cause.

example:
1. why did the feature fail? — the api returned an error
2. why did the api return an error? — the input was invalid
3. why was the input invalid? — we assumed a field was optional
4. why did we assume it was optional? — the spec didn't mention it
5. why didn't the spec mention it? — we never asked the wisher

add "why not?" to challenge further.

### first principles (musk)

break down to fundamental truths, then build up fresh.

steps:
1. identify current assumptions
2. break down to fundamental truths (what do we know is true?)
3. create new solutions from scratch

key question: "what are the material constituents? what is the base cost?"

example (tesla batteries):
- assumption: batteries cost $600/kwh
- first principles: cobalt, nickel, aluminum, carbon costs $80/kwh on london metal exchange
- conclusion: clever combination can yield much cheaper batteries

### musk's 5-step algorithm

for any requirement, part, or process:

| step | action | key question |
|------|--------|--------------|
| 1. challenge requirements | question every requirement | "your requirements are definitely dumb — how to make them less dumb?" |
| 2. delete | try hard to delete the part/process | "if not added back 10% of the time, not deleted enough" |
| 3. simplify | simplify and optimize | "don't optimize what shouldn't exist" |
| 4. accelerate | speed up cycle time | "how can we go faster?" |
| 5. automate | automate last | "never automate what shouldn't exist" |

critical: work steps in order. most people start with step 5 and automate a process that shouldn't exist.

### ladder of inference (argyris)

trace how conclusions form to expose hidden leaps:

```
7. action       ← what we do
6. beliefs      ← what we conclude
5. conclusions  ← what we decide
4. assumptions  ← what we assume
3. interpretation ← how we interpret
2. selection    ← what data we select
1. observation  ← raw data available
```

work backward: "why did I draw that conclusion? what assumption led here? what data did I select?"

### inversion (munger)

think backward to avoid failure:

> "invert, always invert. turn a situation upside down. where don't we want to go, and how do we get there?"

instead of "how do we succeed?", ask "how could we fail?" then avoid those paths.

key practice: "take your assumption and try to disprove it, rather than confirm it."

### pre-mortem

imagine the project has failed, then explain why:

1. assume the plan was implemented and failed miserably
2. each person writes reasons for the failure
3. share and discuss
4. address the most likely failure modes

increases ability to identify negative outcomes by removing optimism bias.

### devil's advocate

assign someone to argue against the plan:

- challenge stated beliefs and assertions
- expose implicit assumptions
- highlight faulty reason
- force consideration of alternatives

key: the role is assigned, not personal — removes social friction.

### red team

structured adversarial review:

1. **analysis**: question arguments and assumptions that go unquestioned
2. **imagination**: figure out what could go wrong (and right)
3. **contrarian**: challenge the plan from alternative perspectives

six strategic questions to ensure the right problem is solved.

### six hats (de bono)

examine from six perspectives:

| hat | focus | question |
|-----|-------|----------|
| white | facts | "what do we know? what do we need to find out?" |
| red | emotion | "how do people feel about this?" |
| black | risks | "what could go wrong? what should we be cautious about?" |
| yellow | benefits | "what's the potential upside?" |
| green | creativity | "what new solutions could we explore?" |
| blue | process | "are we on track? what's next?" |

---

## .question bank

### requirements

- who said this was needed? when? why?
- what evidence supports this requirement?
- what if we didn't do this — what would happen?
- is the scope too large, too small, or misdirected?
- could we achieve the goal in a simpler way?
- what is the minimum viable version?
- your requirements are definitely dumb — how to make them less dumb? (musk)

### assumptions

- what do we assume here without evidence?
- what are we not even aware we assume?
- what would a newcomer question that we accept?
- what if the opposite were true?
- what exceptions or counterexamples exist?
- did the wisher actually say this, or did we infer it?
- is this based on evidence or habit?
- try to disprove this assumption — can you? (munger)

### failure modes

- imagine this failed — why did it fail? (pre-mortem)
- what could go wrong? (black hat)
- where don't we want to go, and how could we get there? (inversion)
- what would someone who disagrees say? (devil's advocate)
- what are we not aware we're not aware of?

### simplification

- can this part/process be deleted? (musk step 2)
- if we deleted this and had to add it back, would we? (musk)
- are we optimizing something that shouldn't exist? (musk step 3)
- what is the simplest approach that works?
- what are the material constituents and base costs? (first principles)

### open questions

- can this be answered via websearch or logic?
- can this be answered by code or docs that exist?
- does only the wisher know the answer?
- does this block progress if unanswered?
- what is the cost of a wrong guess here?

### technical decisions

- is this the simplest approach that works?
- what alternatives did we consider?
- what are the tradeoffs of this choice?
- what will break if this assumption is wrong?
- how will we know if this was the wrong choice?
- could a simpler approach work?
