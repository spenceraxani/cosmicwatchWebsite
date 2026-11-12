# Turning on the contact form (UD Forms Data Processor)

The Contact page form posts to UD's **Forms Data Processor (FDP)**, run by UD
Information Technologies. FDP stores every message in a UD system and emails it
to Prof. Axani. No outside service is involved and the site holds no keys.

Until the form is registered, pressing **Send message** shows a note with a
pre-filled email to saxani@udel.edu instead.

## 1. Get FDP access (once)

Someone with a UD login needs access to FDP, through either of these:

- the Physics and Astronomy departmental forms administrator, or
- a request to UD IT: <https://services.udel.edu/TDClient/32/Portal/Requests/Service/453/Forms-Data-Processor-Support>
  (or email itwd-req@udel.edu).

## 2. Register the form

Log in at <https://www.udel.edu/fdp/>, open **Manage forms**, click **Add a form**
and enter:

| FDP setting | Value |
| --- | --- |
| Form ID | `cosmicwatch-contact` |
| Status | Active |
| Description | CosmicWatch website contact form |
| URL | `https://<site address>/contact/` |
| Group | the department's FDP group |
| Email results to | `saxani@udel.edu` |
| From value | `saxani@udel.edu` |
| Replyto value | Variable, form field `email` (so Reply goes to the visitor) |
| Message subject | `CosmicWatch website message` |
| Email template | see below |
| Return page | `https://<site address>/contact/thanks/` |

`<site address>` is wherever the site is live (the Vercel address now, the UD
address later). If it moves, update **URL** and **Return page** in FDP.

### Fields the form sends

| Field name | What it is |
| --- | --- |
| `first` | First name |
| `last` | Last name |
| `email` | Visitor's email address |
| `message` | The message |
| `formId` | Hidden; `cosmicwatch-contact` |
| `website_check` | Hidden spam trap; always empty from real visitors |

### Email template

FDP asks for a template file for the email it sends. Use the placeholder syntax
from FDP's own template instructions; the content should be:

```
New message from the CosmicWatch website

Name:    {first} {last}
Email:   {email}

{message}
```

## 3. Switch the site over

In `src/data_files/navigation.ts`, set:

```ts
export const CONTACT_FDP_FORM_ID = 'cosmicwatch-contact';
```

Rebuild and deploy. Send one test message and check it arrives and that
**Reply** goes to the address typed into the form.

## Notes

- FDP has no CAPTCHA. The form has a hidden spam trap; if spam becomes a
  problem, ask UD IT what they recommend for FDP forms.
- Downloaded FDP results count as personally identifiable information (PII)
  under UD guidance: delete local copies when no longer needed.
