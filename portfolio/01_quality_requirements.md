# Show and tell: Quality requirements

**Learning outcome:** You research the technical needs of your target audience and document them as quality
requirements. **Rubric row:** Quality requirements (5%)
**Main work by:** Andrea wrote the survey and the QR document

## What we built

We asked book collectors how they catalogue their collections today, using a Google Form aimed at collectors who read
regularly. From their answers we wrote quality requirements based on ISO 25010, each with a measurable target. These
requirements steered our deployment, monitoring, update and offline choices.

## Proof

| What                                       | Where to see it                                |
|--------------------------------------------|------------------------------------------------|
| Survey questions and all responses         | `SurveyResponses.pdf`                          |
| Quality requirements document              | `QualityRequirements-Group5.pdf`               |
| Performance target used in the backend MCA | `MCA_Backend_Framework_v0.2.docx`, section 4.2 |

## What the assessor looks at

| Assessor looks at                    | Our answer                                                                                                                                                                                                       | Proof            |
|--------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------|
| Who we spoke with, and what we found | 15 collectors with collections from about 230 to about 1500 books. Main pains: manual entry is slow, spreadsheets are fragile, they use phone and laptop, and short outages are acceptable but data loss is not. | Survey responses |
| Concrete and measurable QRs          | Each QR has a target, for example 95% of API requests answer within 500 ms, and 95% availability for a single server.                                                                                            | QR document      |
| How QRs show up in the product       | See the table below                                                                                                                                                                                              | Links per row    |

| Quality requirement                                         | Where it shows up                                                                                                                                                                                                                   |
|-------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Performance: 500 ms for 95% of requests                     | Latency alert in Grafana (see 07 Monitoring). The rule in `monitoring/backend-alert-rules.yaml` fires when p95 latency is above 1000 ms over 5 minutes, so it is looser than the 500 ms target, mainly due to the slow external API |
| Availability, no disruption during updates                  | Rolling updates with two instances (see 08 Update strategy)                                                                                                                                                                         |
| Confidentiality: nobody else can see my collection          | Owner filters and JWT, other users get 404 (see 02 Security)                                                                                                                                                                        |
| Usable without internet at home                             | Read only offline PWA                                                                                                                                                                                                               |
| Works on phone and laptop                                   | Responsive frontend, camera scanning on phone                                                                                                                                                                                       |
| Testability                                                 | Traceability matrix links tests to stories (see 06 End to end tests)                                                                                                                                                                |
| Resource utilisation: full stack under 75% of server memory | Measured with `docker stats` on the shared server: about 880 MiB of 1.9 GiB (46%), see `01_docker_stats_acceptance.png`                                                                                                             |
## Link to requirements

Survey answers fed the user stories US-01 to US-11 and the QR document.

## Decisions and trade offs

* **95% availability instead of 99.9%:** one server with no redundancy cannot honestly promise more, and respondents
  said occasional downtime is acceptable. Trade off: no failover if the server dies.
* **Offline read only:** respondents wanted to see their library without internet, but rarely add books offline. Trade
  off: Adding books needs a connection. Given time we would set this up with a real system that allows the user to use the app offline.

## Problems we ran into

* **Availability conflicted with zero downtime updates:** our first draft promised both 95% and no downtime during
  updates. We kept 95% for unplanned outages and made updates a separate requirement.
* **First drafts were not SMART:** learnability, accessibility, modifiability and adaptability lacked a
  number. And many requirements were not worded in a SMART way.

## What we learned

### Andrea

* **Could not do at the start, can do now:** I have a much better understanding of how to setup quality requirements, some things about them I still find hard to gauge like things related to performance of the system, due to not having worked with big systems and real user traffic  
* **Would do differently next time:** Not sure, I definitely need to keep the requirements in mind better during the whole development process, the pace of this project made me rush a bit.
* **Already knew before this course:** I have had to work on quality/technical requirements before, but this project is the closest I got to something real and deployed.

## Use of generative AI

Claude reviewed our QR document against ISO 25010 and pointed out missing SMART targets. This document was drafted with
Claude from our own project notes and checked by us.
