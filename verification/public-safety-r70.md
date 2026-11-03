# Public release safety patch — r70

Base: 1797c21caa9828b49d844165e636ddde84e6bd27.

- Removed the journal's internal planning-document anchor.
- Removed all four private planning-document URLs and identifiers from runtime policy modules and the public policy catalog; source headings/review notes were also removed.
- Removed the same metadata from the current public repository audit roster.
- Removed personal local home/backup paths from public assets and repository notes.
- Replaced the visitor About screen's implementation change log with gameplay information, limitations, privacy details and required open-data/asset attribution.
- Preserved fourteen approved policy names/categories, every conversation branch, all game mechanics, world assets and multiplayer configuration. References to internal documents in spoken copy were replaced with equivalent proposal wording.
- Both entrypoints and the policy import chain use a new cache revision.
- Original source documents, document sharing, repository permissions and Git history were not changed.

Validation: 151 tests passed, including completed-journal rendering and a public repository text scan. Four original private document identifiers were additionally checked across all current repository files with no matches. Local browser: WebGL ready, journal opens without document anchors, visitor About opens with required attribution.

Residual risk: the preceding public Git commit already contains the removed links. A normal corrective commit does not erase previous commits, existing browser/CDN caches, forks or prior downloads. No evidence establishes who accessed the linked documents. History cleanup and document access review require a separate owner decision.
