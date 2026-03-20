import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

interface Props { params: { slug: string } }

interface Article {
  title: string;
  metaTitle: string;
  metaDescription: string;
  primaryKeyword: string;
  body: string;
}

const ARTICLES: Record<string, Article> = {
  "free-obituary-search": {
    title: "How to Find Obituaries Online for Free",
    metaTitle: "How to Find Obituaries Online for Free",
    metaDescription: "Find obituaries online for free — no paywall, no subscription. Learn where to search and how to find anyone in the public record.",
    primaryKeyword: "free obituary search",
    body: `
Her name was Margaret Elaine Kowalski. She passed away in February 2019. Her son, calling from Ohio, was trying to find any record of her life — a photo, a name in a database, something to show his own children when they were old enough to ask about their grandmother.

He didn't know where to start.

If you're in a similar situation — searching for an obituary, a death record, or some trace of a life that mattered — here is the most complete guide to finding obituaries online for free.

## Where to Start: The Free Sources

**Eternaflame** is the only memorial platform built specifically to index every human life, including the 70% of people who never received a published obituary. Search by name, location, or year at [eternaflame.org/search](/search) — free, no account required, no paywall.

**Legacy.com** aggregates obituaries from hundreds of newspapers. Their basic search is free; some full text requires visiting the newspaper directly. Start here for deaths after 2000.

**Newspapers.com and GenealogyBank** have digitized millions of historical obituaries, but both charge subscriptions. Many public libraries offer free access — check your library card before paying.

**Find A Grave and BillionGraves** index cemetery records and headstones. Not every record has an obituary, but the death date and location can point you to the right newspaper.

**FamilySearch.org** is completely free and holds billions of records. Their death index and newspaper archive are excellent starting points for pre-2000 deaths.

**The Social Security Death Index (SSDI)** is a free federal database listing every Social Security number holder who has died since the 1960s. It gives you the name, birth date, death date, and last-known ZIP code — enough to identify the right newspaper.

## Searching by Location

Obituaries were almost always published in the local newspaper closest to where someone lived or died. Once you have an approximate location:

1. Identify the town or county
2. Find the local newspaper using Chronicling America (newspapers.loc.gov) or Google
3. Check if that paper is digitized on Newspapers.com, GenealogyBank, or the newspaper's own website
4. Search for the name in the year range around the death

Many small-town papers have not been digitized. In that case, contact the newspaper directly or call the local public library — many libraries maintain obituary clipping files going back decades.

## Death Certificates as a Backup

If you can't find an obituary, a death certificate often confirms the basics: name, date, place, and cause of death. Most states allow relatives to request death certificates; some states make historical records publicly searchable.

California, Texas, and Florida have particularly accessible death index databases. Search "[state name] death records" plus the year.

## When the Obituary Doesn't Exist

This is more common than most people realize. About 70% of people who die never receive a published obituary — the cost (often $300–$500 at a newspaper), the logistics, and the time pressure of grief all work against it.

For those people, the only record may be a death certificate, a cemetery headstone, or a vital statistics entry. That's why platforms like Eternaflame exist: to give every person a permanent place in the record, even those who never made it into print.

If you've found a name and a date but nothing else, you can [add them to the Eternaflame record](/create) yourself. It's free. It takes ten minutes. And it means their name is searchable forever.

## A Final Note

Searching for someone who is gone is an act of love. It means you haven't let them disappear. Whatever you find — an obituary, a death certificate, a headstone photo — it's worth saving somewhere permanent.

[Search the Eternaflame record →](/search)
    `,
  },

  "how-to-preserve-family-history": {
    title: "How to Preserve Your Family's History Before It's Gone",
    metaTitle: "How to Preserve Your Family's History Before It's Gone",
    metaDescription: "The stories nobody has written down yet are going to disappear. Here's how to preserve your family's history while you still can.",
    primaryKeyword: "how to preserve family history",
    body: `
There is a window. It opens when the oldest living member of a family is still able to speak, still willing to be asked, still here. Then it closes. And most of the time, nobody was there to record what passed through it.

Your grandmother knows things about her childhood that are in no document anywhere. Your father remembers things about his father that will vanish the moment your father's memory starts to fail. These aren't dramatic secrets — they're ordinary details. What a grandmother's kitchen smelled like. How a great-grandfather got his nickname. The town in Poland that nobody in your family can quite name anymore.

Here's how to preserve them before it's too late.

## Start With What You Have

Before recording anything new, gather what already exists:

- **Old photographs** — scan them at 600 DPI minimum. Label who is in each photo and the approximate year on the back (or in metadata). A photo without names is lost within two generations.
- **Documents** — birth certificates, marriage licenses, military discharge papers (DD-214), immigration papers, passports, diplomas. Scan and store in at least two places.
- **Letters and cards** — especially wartime correspondence. These are irreplaceable primary sources.
- **Home videos** — VHS tapes degrade. If you have old videotapes, transfer them now. Services like Legacybox do this for ~$60–150.

## The Most Important Thing You Can Do This Week

Call someone older and ask one question. Just one. Not "tell me about your life" — that's too big. Ask something specific:

- "What do you remember about your parents' house?"
- "What did your grandmother do for work?"
- "What was the hardest year of your life?"

Record it on your phone. Don't edit it. The pauses and the "um"s are part of it.

## Structured Ways to Capture Stories

**StoryCorps** has free interview guides at storycorps.org. Their app records directly to the Library of Congress.

**Oral history interviews** — sit down with a parent or grandparent and work through a list of questions covering childhood, family, work, major life events, and their advice for people who come after them. The Smithsonian Institution has a free interview guide.

**Written memoir prompts** — some people won't talk but will write. Give them a notebook and ten questions. Even partial answers are more than nothing.

## Where to Store What You Collect

The goal is redundancy. Nothing in only one place:

- **Cloud storage** (Google Drive, iCloud, Dropbox) for working copies
- **External hard drive** stored at a relative's house for backup
- **A permanent platform** — Eternaflame lets you create a profile that holds the biographical record, with no expiration date and no paywall

## The Thing People Always Regret

Not starting earlier. Every family historian will tell you the same thing: they waited too long, and someone died, and now there's a gap that can never be filled.

You don't need a perfect system. You need to start somewhere. A phone recording, a scanned photograph, a paragraph written down.

[Add someone to the Eternaflame record — free forever →](/create)
    `,
  },

  "create-free-online-memorial": {
    title: "How to Create a Free Online Memorial That Actually Lasts",
    metaTitle: "How to Create a Free Online Memorial That Actually Lasts",
    metaDescription: "Most free memorial sites disappear. Here's how to create an online memorial that's genuinely permanent — and costs nothing.",
    primaryKeyword: "create online memorial free",
    body: `
In 2015, a family created a memorial page for their father on a popular free memorial site. They added photos, stories, a biography. Friends from across the country signed the guestbook. It became a real document of a real life.

In 2021, the site shut down. Everything was gone.

This is what happens to most free online memorials. The company runs out of money, gets acquired, or simply decides the product isn't worth maintaining. The "free" part turns out to be contingent on the company's survival.

Here's what to look for in a memorial platform that will actually last — and how to create one that does.

## What Makes an Online Memorial Permanent

A few things distinguish temporary free services from genuinely permanent ones:

**Data export.** Can you download everything you've added, at any time, in a usable format? If a platform doesn't offer this, you're at their mercy.

**Open data commitment.** Has the organization publicly committed to what happens to records if they shut down? "We'll transfer everything to the Internet Archive" is a meaningful answer. Silence isn't.

**No paywall on existing records.** Some platforms let you create a memorial for free but then charge to view it later, or to keep it from expiring. This is a form of hostage-taking.

**Institutional backing.** Is the platform backed by something more durable than a VC-funded startup? University archives, government institutions, and nonprofits have better track records for long-term data stewardship than venture-backed companies.

## Step-by-Step: Creating a Memorial on Eternaflame

Eternaflame is free, permanent, and built around data durability. Here's how to create a profile:

1. Go to [eternaflame.org/create](/create)
2. Enter the person's name and life dates
3. Add a location — where they lived, where they were born
4. Write their story in the biography field — this doesn't have to be long. Two paragraphs capturing who they were is more valuable than a formal obituary
5. Add family connections — spouse, children, parents, siblings
6. Add interests, career, military service, education
7. Leave the privacy setting on "public" so the profile is searchable

The whole process takes 10–20 minutes for a basic profile. Family members can add to it over time.

## What to Include (and What to Skip)

**Include:** Full name (including maiden name if applicable), birth date and place, death date, one sentence capturing who they were, key relationships, the places that mattered most to them.

**Skip:** Anything you're not sure about. Empty fields show nothing — there are no "Unknown" placeholders on Eternaflame. Better to have an incomplete record that's accurate than a complete one with guesses.

**The most important thing:** The personality summary. One or two sentences about who they actually were — not their job title or their achievements, but their character. "Known for her sharp wit and terrible puns" is worth more than three paragraphs of resume.

## After You Create It

Share the link with family. Send it to people who knew them. Add it to the section of the family history you're keeping.

The profile is permanent and searchable. Their name will appear when someone searches for them. Their story will be there for grandchildren they never met, for researchers a hundred years from now, for anyone who wants to know that this person lived.

[Create a free memorial →](/create)
    `,
  },

  "digital-legacy": {
    title: "Your Digital Legacy: What You Leave Behind When You're Gone",
    metaTitle: "Your Digital Legacy: What You Leave Behind When You're Gone",
    metaDescription: "What happens to your online presence, your photos, your accounts — and your memory — after you die.",
    primaryKeyword: "digital legacy",
    body: `
Right now, somewhere on a server farm, there are photographs of you that nobody has printed. Email conversations that capture your voice better than any document. A Facebook account that will outlive you by decades.

Most people have never thought about what happens to this. And most people's digital legacy — the online record of a life — will be handled badly, or not at all.

Here's what actually happens, and what you can do about it.

## What Happens to Social Media After You Die

**Facebook:** Accounts can be memorialized (turning them into tribute pages) or deleted. Someone must contact Facebook with a death certificate. Memorialized accounts remain visible but can't be logged into. You can designate a "legacy contact" in your settings to manage the account after your death.

**Instagram:** Same parent company, similar policy — accounts can be memorialized or removed upon request.

**Twitter/X:** Can be deactivated by a family member with documentation. No memorialization option.

**LinkedIn:** Can be removed upon request. There is no memorialization option.

If you don't designate someone in advance, these accounts simply remain — active-looking ghosts, sometimes sending automated birthday reminders to your contacts for years.

## Email and Cloud Storage

Gmail, iCloud, and most major email providers have inactive account policies — accounts that haven't been logged into for 12–24 months may be deleted. Your photos, your correspondence, your files: gone.

Google has an "Inactive Account Manager" that lets you designate what happens to your data and who gets access. It takes ten minutes to set up and is worth doing today.

Apple has a similar feature called Digital Legacy. You designate up to five people who can request access to your data after your death.

## Passwords: The Practical Problem

Most families find that when someone dies, they can't access crucial accounts — banking, email, photo libraries — because they don't know the passwords.

A password manager with an emergency access feature (1Password, Bitwarden) solves this. Alternatively, a sealed envelope with passwords stored somewhere a trusted person will find it after you're gone.

## Your Story: The Part Most Services Get Wrong

Digital accounts preserve data. They don't preserve memory. A hard drive full of photos isn't the same as a narrative of a life. An inbox full of emails doesn't tell your grandchildren who you were.

The part of your digital legacy that matters most — the story, the character, the things that made you you — requires intentional curation. That means:

- **Writing it down.** A brief biography. A list of things you'd want people to know about you. Even a few paragraphs.
- **Storing it somewhere permanent.** Not just in a Google Drive folder that will be deleted eventually.

Eternaflame's [living memorial feature](/start) lets you start building your own record while you're alive — in your own words, on your own terms. It lives there permanently, free, and you can add to it whenever you have something to say.

## The One Thing Worth Doing This Week

Set up Google's Inactive Account Manager or Apple's Digital Legacy feature. It takes ten minutes. It means the photos and emails that matter most won't simply evaporate.

Then think about the story part. Not the data — the story. Who you are, what you've done, what you'd want people to know.

[Start your own Eternaflame →](/start)
    `,
  },

  "how-to-write-a-memorial": {
    title: "How to Write a Memorial That Actually Sounds Like the Person",
    metaTitle: "How to Write a Memorial That Actually Sounds Like the Person",
    metaDescription: "A memorial should sound like the person — not a funeral home. Here's how to write one that gets it right.",
    primaryKeyword: "how to write a memorial",
    body: `
Most memorials are written in a strange, flattened language that sounds nothing like the person it's describing. "He was a devoted husband and father who loved fishing and the Arkansas Razorbacks." Technically accurate. Completely bloodless.

The people who knew him will recognize the facts. They won't feel anything they didn't already feel.

Here's how to write a memorial that actually sounds like the person — that captures something real, something worth reading, something worth keeping.

## The One Rule

Write toward the specific, not the general. "He loved fishing" is general. "He could spend six hours on a dock at Greers Ferry Lake without saying twenty words, and come home happy" is specific. Specific is what makes someone real.

Every good memorial has at least one detail so specific that only people who knew the person will fully recognize it — and everyone else will wish they had known them.

## Start With Character, Not Credentials

The instinct is to list accomplishments: job titles, years of service, clubs joined. Resist it.

Start instead with character. What was this person actually like? Not what did they do — who were they?

A few questions to get there:
- What would they say in a situation most people would stay quiet in?
- What did they do that nobody else did quite the same way?
- What will people who knew them find themselves still doing — a phrase they use, a habit they picked up — years after this person is gone?
- What's the story that always gets told when someone mentions their name?

## Structure That Works

**Opening:** A scene, a moment, a specific detail. Not "John was born in..." but "Anyone who knew John Turner knew better than to ask him a yes-or-no question."

**The middle:** Life arc in broad strokes, but anchored in specific details. Where they were from, what they did, who they loved. The people, the places, the things that mattered.

**Character in evidence:** Two or three anecdotes that illustrate who they were, not just what they did.

**Legacy:** What they leave behind — not just people, but something less tangible. A way of looking at things. A phrase. A tradition. How they changed the people around them.

**Closing:** Something that sounds like them — a line they would have liked, or something they said.

## What Not to Write

- "He is survived by..." — list relationships naturally in the body of the piece instead
- "He touched so many lives" — show it, don't say it
- "She is no longer in pain" — avoid euphemisms unless the person would have used them
- "He was taken too soon" — unless they were, say what you mean

## A Note on Length

A good memorial can be two paragraphs or two pages. Length isn't the measure. Does it sound like the person? Does it capture something true? Can someone who never met them understand, by the end, who they were?

If yes, it's long enough.

## Where It Lives

Once you've written it, put it somewhere permanent. [Eternaflame](/create) lets you add a biography to a profile that stays searchable forever — free, no paywall, no expiration.

[Add their story to the record →](/create)
    `,
  },

  "vietnam-veterans-arkansas": {
    title: "Remembering Vietnam Veterans from Arkansas",
    metaTitle: "Remembering Vietnam Veterans from Arkansas",
    metaDescription: "Arkansas sent thousands of men and women to Vietnam. Here's how to find their records, honor their service, and make sure they're not forgotten.",
    primaryKeyword: "vietnam veterans arkansas",
    body: `
Arkansas sent approximately 56,000 men and women to serve in Vietnam. 479 of them did not come home.

Their names are on the Vietnam Veterans Memorial in Washington. Some of them are in the Arkansas State Veterans Cemetery in North Little Rock. Many are buried in small county cemeteries across the state, under headstones that are slowly becoming harder to read.

This is what it looks like to remember them, and how to find the records of those who served.

## Finding Arkansas Vietnam Veteran Records

**The National Archives** holds military service records for veterans who served after 1912. The process is free and can be initiated at archives.gov/veterans. Many Vietnam-era records were damaged in the 1973 National Personnel Records Center fire, but partial records often exist.

**The Vietnam Veterans Memorial Fund** database at vvmf.org lists all 58,281 names on The Wall. You can search by name, home state, hometown, branch, and casualty date.

**The Arkansas Secretary of State** maintains a Veterans Cemetery database. North Little Rock's Arkansas State Veterans Cemetery is searchable online.

**Find A Grave** has indexed thousands of Arkansas Vietnam veterans' graves. Many include photographs of headstones.

**Ancestry.com and FamilySearch** both have access to Vietnam-era draft registration records and some service records.

## The Ones Who Came Home

The 55,000+ Arkansas veterans who returned from Vietnam came home to a country that treated them, in many cases, with hostility. They built families, started businesses, coached Little League, taught school. They are still in our communities today — and many of their stories have never been told.

If you know a Vietnam veteran from Arkansas — or knew one who has passed — their story belongs in the permanent record. Not just their service record, but who they were.

## Searching the Eternaflame Record

The Eternaflame record already contains memorial profiles for veterans across Arkansas. You can [search by name](/search) or [browse Vietnam War veterans from Arkansas](/military/vietnam-war/arkansas/) to find records of those already in the index.

If someone you're looking for isn't there yet, [adding them takes about ten minutes and is completely free](/create). Their service can be recorded — branch, unit, conflict, years served, medals — alongside their full life story.

## A Note on the Living

Vietnam veterans are in their 70s now. The window for capturing their stories in their own words is narrowing.

If you have a Vietnam veteran in your family or community, ask them. Not about the war, if they don't want to talk about it — but about their life. What they did before. What they did after. What they're proud of. What they want people to remember.

Their answers belong somewhere permanent.

[Browse Vietnam veterans in the Arkansas record →](/military/vietnam-war/arkansas/)
    `,
  },

  "living-memorial": {
    title: "Why You Should Start Your Own Memorial While You're Still Alive",
    metaTitle: "Why You Should Start Your Own Memorial While You're Still Alive | Eternaflame",
    metaDescription: "Every platform waits until you're gone. This one lets you tell your own story — while you still have one to tell.",
    primaryKeyword: "living memorial",
    body: `
Every memorial platform in existence operates on the same assumption: someone has already died.

You die. Then someone who loved you scrambles to assemble something — a biography from old emails, memories pieced together at the worst possible time, photos that may or may not capture who you actually were. The result is always incomplete. It's always filtered through grief and haste. It's almost never in your words.

There's a better way.

## What a Living Memorial Is

A living memorial is a biographical record you build while you're alive. Not a will, not a medical directive — a life document. The places you've been. The people who matter. The things you want people to know about you when you're gone (and, frankly, when you're still here).

It's not morbid. It's the opposite. It's what happens when you take your own story seriously enough to tell it on your own terms.

## What You Include

The basics: name, birth year, where you grew up, where you've lived. These are the anchors.

The story: What you've done. Who you've loved. What you believe. What you've survived. What you're proud of.

The character detail: The thing that makes you recognizable to anyone who knows you. "Known for his terrible dad jokes and his exceptional brisket." One sentence that sounds like you.

The places: The cities, the houses, the landmarks that shaped you. The lake where you learned to fish. The city where you spent your twenties.

The people: Your family, your close friends, your mentors. People who don't have profiles yet can be listed by name.

## Why Now Is the Right Time

Because you know the details better than anyone. Because the people who will assemble this after you're gone will be grieving and rushed and working from incomplete information. Because your great-grandchildren will want to know who you were, and they're not born yet.

There's no emergency. You can build this slowly, over years, adding things as they occur to you. The profile doesn't have to be complete — it just has to start.

## The Flame

On Eternaflame, living profiles are marked with a small flame (🔥) next to the name. No label, no explanation — just a signal that this person is here, actively adding to their record, telling their story while they still can.

When they pass, the flame is removed. The dates are added. The profile continues.

[Start your Eternaflame →](/start)
    `,
  },

  "preserving-voice-recordings": {
    title: "The Most Irreplaceable Thing You Can Leave Behind: Your Voice",
    metaTitle: "The Most Irreplaceable Thing You Can Leave Behind: Your Voice",
    metaDescription: "Photos fade. Documents get lost. But a two-minute voice recording of someone telling a story is worth more than any biography.",
    primaryKeyword: "preserve voice recordings family",
    body: `
A few years ago, a woman named Ruth was going through her late mother's belongings when she found an old answering machine tape. On it: her mother's voice, leaving a message, sometime in the late 1990s.

She hadn't heard that voice in four years. She sat on the floor of her mother's kitchen and listened to it seventeen times.

Of all the things we leave behind, the voice is the most viscerally irreplaceable. A photograph is a moment. A document is information. A voice is a person — their particular rhythm, their laugh, the way they say certain words.

Most of us are losing our family's voices every year.

## Why Voice Recordings Disappear

Answering machine tapes. Voicemail messages on old phones. Video taken on format-specific cameras that no current device can read. VHS tapes deteriorating in boxes. The medium fails, and the voice goes with it.

The good news: in 2024, preserving a voice recording is cheaper and easier than it has ever been. The challenge is doing it intentionally, before the opportunity is gone.

## How to Preserve Existing Recordings

**Voicemails:** Both iPhone and Android allow voicemail saving. iPhone: tap "Share" on the voicemail in the Phone app. Android varies by carrier. Third-party apps like Google Voice preserve all voicemails in audio files.

**Answering machine tapes:** A $20–30 audio cassette-to-USB adapter connects to any computer and lets you record the playback. Free software like Audacity captures it as an MP3.

**VHS and Hi8 tapes:** Services like Legacybox ($60–150) and local Costcos convert these to digital. Do not wait — these tapes have a finite lifespan.

**Old voicemail systems:** If you have access to the account, most carriers allow exporting. If not, playing the voicemail aloud and recording it with your phone microphone is imperfect but preserves the voice.

## How to Capture New Recordings While You Still Can

The most valuable recordings are often the simplest: someone telling a story.

Ask a parent, grandparent, or aging relative to tell you one story. Any story. Record it on your phone. The Voice Memos app on iPhone and the Recorder app on Android both produce high-quality MP3 files.

Specific prompts that tend to produce good recordings:
- "Tell me about the day you got married"
- "What was the house you grew up in like?"
- "Tell me about a time you were really scared"
- "What do you want me to remember about you?"

A two-minute recording answering one of these questions is worth more than any amount of biographical documentation.

## Where to Store Recordings

**Short-term (immediate backup):** Google Drive or iCloud
**Long-term (permanent):** The Internet Archive allows you to upload personal audio files to their permanent collection at archive.org/upload — free, institutional-level permanence.

A photograph or link to the recording can be added to an Eternaflame profile as part of the Memories section.

## The Window Is Closing

The people whose voices you most want to keep are getting older. Technology keeps improving, but it can't recover a voice that was never recorded.

The hardest part isn't the technology. It's remembering to do it before it's too late.

[Add someone to the permanent record →](/create)
    `,
  },

  "what-to-do-after-someone-dies-online": {
    title: "What Happens to Someone's Online Presence After They Die",
    metaTitle: "What Happens to Someone's Online Presence After They Die",
    metaDescription: "From social media to email to memorial sites — what actually happens, what you can control, and how to make sure their memory is preserved.",
    primaryKeyword: "what happens to online accounts when someone dies",
    body: `
When someone dies, their online presence doesn't disappear. It persists — sometimes for years, sometimes indefinitely — sending birthday reminders, appearing in algorithm-surfaced memories, living on in inboxes and comment sections and old profiles.

Some of this is comforting. Some of it is not. Most of it is unmanaged.

Here's what actually happens to each major type of online account, and what you can do about it.

## Social Media Accounts

**Facebook** — Can be memorialized or deleted. To memorialize: report the death through Facebook's "Special Request for Deceased Person's Account." The profile stays up, can't be logged into, and shows "Remembering" next to the name. To delete: a verified immediate family member can submit a removal request with a death certificate.

You can also designate a "legacy contact" in Settings > Account > Memorialization Settings before death. This person can post to the timeline, respond to friend requests, and update the profile picture.

**Instagram** — Same parent company. Can be memorialized or deleted upon request. No legacy contact feature.

**TikTok** — No formal memorialization policy as of 2024. Accounts of deceased users sometimes persist indefinitely.

**LinkedIn** — Can be reported for removal. No memorialization option.

**Twitter/X** — Family members can request deactivation with documentation. No memorialization.

## Email

Most major email providers have inactive account policies:

**Gmail/Google** — Deleted after approximately 2 years of inactivity, unless the account holder set up Google's Inactive Account Manager beforehand to designate a recipient.

**iCloud/Apple Mail** — Apple has a Digital Legacy feature that allows designated contacts to request data access after death.

**Outlook/Hotmail** — Microsoft will release content to next of kin with documentation.

For all of these: if access to the account itself is needed (for passwords, contacts, important documents), the process typically requires a court order unless the account holder gave login information in advance.

## Cloud Storage and Photos

Google Photos, iCloud Photos, Dropbox — these hold things that may be irreplaceable. The same inactive account policies apply. The only reliable approach is:
1. Back up critical photos to a physical drive before access is lost
2. Use Google's Inactive Account Manager or Apple's Digital Legacy to designate someone

## Subscriptions and Paid Services

Monthly subscriptions continue charging until cancelled. Streaming services, software, memberships — these require notifying each provider with a death certificate. Many will refund the partial month.

## The Permanent Record

Unlike social media (which archives, memorializes, but doesn't truly tell a story), a permanent memorial profile preserves who someone was — not just their accounts.

Eternaflame profiles can be created by family after a death, or by the person themselves while alive. They hold the biography, the relationships, the places, the memories — everything a social media profile doesn't capture. And they're permanent, free, and searchable.

[Add someone to the permanent record →](/create)
    `,
  },

  "cemetery-records-online": {
    title: "How to Find Cemetery Records and Headstone Photos Online",
    metaTitle: "How to Find Cemetery Records and Headstone Photos Online",
    metaDescription: "Find grave locations, headstone photos, and burial records for free — without leaving your home.",
    primaryKeyword: "cemetery records online",
    body: `
The headstone exists. Somewhere, in a cemetery you may never have visited, there is a stone with the name and dates of someone you've been trying to find. You don't need to fly there to see it.

Here's how to find cemetery records and headstone photographs online, for free.

## The Best Free Resources

**Find A Grave (findagrave.com)** is the largest free database of cemetery records and headstone photographs in the world — over 220 million memorials. Volunteers have photographed headstones across thousands of cemeteries. Search by name and narrow by location. If a photo exists, it's usually here.

**BillionGraves (billiongraves.com)** is a rival database built similarly, with GPS-tagged headstone photos. Particularly strong in the American West and internationally.

**USGenWeb Tombstone Transcription Project** — volunteers have transcribed thousands of rural American cemeteries that have never been photographed. Useful for small county cemeteries.

**FamilySearch.org** — completely free, holds billions of records including cemetery transcriptions, death certificates, and burial indexes. Particularly strong for older records (pre-1950).

**Interment.net** — older but still useful for smaller cemetery transcription projects.

## Requesting a Headstone Photo

If you've found a record on Find A Grave but there's no photo, you can submit a photo request. Volunteers in that area will receive the request and, if they're willing, go photograph it.

The request is free. Photos are usually fulfilled within days to months, depending on location and volunteer availability.

## State-Specific Cemetery Databases

Many states maintain their own digital cemetery records:

- **Texas:** Texas State Library maintains a cemetery database
- **Ohio:** Ohio Cemeteries database at grave.ohiohistory.org
- **New England states:** Several state genealogical societies have mapped most historic cemeteries
- **Veterans:** The National Cemetery Administration has a gravesite locator at gravelocator.cem.va.gov for all national and state veterans cemeteries

## Death Certificates as a Starting Point

If you don't know where someone was buried, the death certificate usually lists the burial location. Most states have publicly searchable death certificate indexes with varying privacy restrictions by time period.

Once you have the cemetery name and location, Find A Grave and BillionGraves can usually take you to the specific record — and often a photograph.

## Adding to the Permanent Record

Cemetery records tell you where someone's body is. They don't tell you who the person was.

If you're researching someone and want to preserve more than dates and a location, [Eternaflame](/create) lets you add a full profile — biography, family connections, places, military service, interests — for free. The cemetery record and the life record belong together.

[Search the Eternaflame record →](/search)
    `,
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = ARTICLES[params.slug];
  if (!article) return { title: "Not found" };
  return {
    title: article.metaTitle,
    description: article.metaDescription,
    alternates: { canonical: `https://eternaflame.org/learn/${params.slug}` },
    keywords: [article.primaryKeyword, "obituary", "memorial", "Eternaflame"],
  };
}

export default function LearnArticlePage({ params }: Props) {
  const article = ARTICLES[params.slug];
  if (!article) notFound();

  // Convert markdown-ish body to paragraphs (simple: split on blank lines)
  const paragraphs = article.body.trim().split(/\n\n+/);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.metaDescription,
    url: `https://eternaflame.org/learn/${params.slug}`,
    publisher: {
      "@type": "Organization",
      name: "Eternaflame",
      url: "https://eternaflame.org",
    },
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 animate-fade-in">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <nav className="text-sm text-warm-tertiary mb-8">
        <Link href="/" className="hover:text-flame transition-colors">Eternaflame</Link>
        <span className="mx-2">›</span>
        <span className="text-warm-secondary">Learn</span>
      </nav>

      <h1 className="text-3xl sm:text-4xl font-bold text-warm-primary mb-6 leading-tight"
        style={{ fontFamily: "var(--font-playfair)" }}>
        {article.title}
      </h1>

      <div className="biography-text text-warm-secondary flex flex-col gap-6">
        {paragraphs.map((p, i) => {
          if (p.startsWith("## ")) {
            return (
              <h2 key={i} className="text-xl font-semibold text-warm-primary mt-4 -mb-2"
                style={{ fontFamily: "var(--font-playfair)" }}>
                {p.replace("## ", "")}
              </h2>
            );
          }
          if (p.startsWith("**") && p.endsWith("**")) {
            return (
              <p key={i} className="text-warm-primary font-semibold">{p.replace(/\*\*/g, "")}</p>
            );
          }
          // Handle inline links like [text](url)
          const parts = p.split(/(\[[^\]]+\]\([^)]+\))/g);
          return (
            <p key={i} className="leading-relaxed">
              {parts.map((part, j) => {
                const match = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
                if (match) {
                  return (
                    <Link key={j} href={match[2]} className="text-flame hover:underline">
                      {match[1]}
                    </Link>
                  );
                }
                // Bold within paragraphs
                const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
                return boldParts.map((bp, k) => {
                  if (bp.startsWith("**") && bp.endsWith("**")) {
                    return <strong key={k} className="text-warm-primary">{bp.slice(2, -2)}</strong>;
                  }
                  return <span key={k}>{bp}</span>;
                });
              })}
            </p>
          );
        })}
      </div>

      {/* CTA */}
      <div className="mt-16 border-t border-[rgba(245,158,11,0.08)] pt-10 text-center">
        <p className="text-warm-secondary mb-6">
          Add someone to the permanent record — free forever.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/search"
            className="px-8 py-3.5 rounded-button text-[#0d0f0e] font-semibold text-base transition-all duration-200 hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #F59E0B 0%, #92400E 100%)" }}>
            Search the Eternaflame Record
          </Link>
          <Link href="/create"
            className="px-8 py-3.5 rounded-button text-warm-primary font-semibold text-base border border-[rgba(245,158,11,0.35)] hover:border-flame hover:text-flame transition-all duration-200">
            Add someone to the record
          </Link>
        </div>
      </div>
    </div>
  );
}
