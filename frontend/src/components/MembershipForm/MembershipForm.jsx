/**
 * components/MembershipForm
 *
 * The desktop left panel: "Library Membership Information".
 *
 * Presentational only -- driven by props from the useLibrary hook:
 *   form           the flat 18-field object (values)
 *   onFieldChange  (name, value) => void
 *   memberTypes    dropdown options (defaults to the desktop combobox values)
 *
 * Layout mirrors the Tkinter grid exactly: a left column (Member Type + 8
 * entries) and a right column (9 entries), with identical labels and order.
 * The `name` of each field matches the API's flat field keys, so values map
 * 1:1 to form state with no translation.
 */

import styles from "./MembershipForm.module.css";

// Desktop combobox values (comMember['value'] in the source).
const DEFAULT_MEMBER_TYPES = ["Admin Staf", "Student", "Lecturer"];

// Left column below the Member Type dropdown (desktop grid column 0/1).
const LEFT_FIELDS = [
  { name: "PRN_NO", label: "PRN.No:" },
  { name: "ID", label: "ID No:" },
  { name: "FirstName", label: "Firstname:" },
  { name: "LastName", label: "Lastname:" },
  { name: "Address1", label: "Address1:" },
  { name: "Address2", label: "Address2:" },
  { name: "PostId", label: "Postcode:" },
  { name: "Mobile", label: "Mobile No:" },
];

// Right column (desktop grid column 2/3).
const RIGHT_FIELDS = [
  { name: "BookId", label: "Book ID:" },
  { name: "BookTitle", label: "Book Title:" },
  { name: "Auther", label: "Auther:" },
  { name: "Dateborrowed", label: "Date Borrowed:" },
  { name: "DateDue", label: "Date Due:" },
  { name: "DayOnBook", label: "Days On Book:" },
  { name: "LaterReturnFine", label: "Late Return Fine:" },
  { name: "DateOverDue", label: "Date Over Due:" },
  { name: "FinalPrice", label: "Actual Price:" },
];

function Field({ name, label, value, onFieldChange }) {
  return (
    <div className={styles.row}>
      <label className={styles.label} htmlFor={`fld-${name}`}>
        {label}
      </label>
      <input
        id={`fld-${name}`}
        className={styles.input}
        type="text"
        name={name}
        value={value ?? ""}
        onChange={(e) => onFieldChange(name, e.target.value)}
      />
    </div>
  );
}

export default function MembershipForm({
  form,
  onFieldChange,
  memberTypes = DEFAULT_MEMBER_TYPES,
}) {
  return (
    <section className={styles.panel} aria-label="Library Membership Information">
      <span className={styles.legend}>Library Membership Information</span>

      <div className={styles.columns}>
        {/* Left column: Member Type dropdown + entries */}
        <div className={styles.column}>
          <div className={styles.row}>
            <label className={styles.label} htmlFor="fld-Member">
              Member Type
            </label>
            <select
              id="fld-Member"
              className={styles.select}
              name="Member"
              value={form.Member ?? ""}
              onChange={(e) => onFieldChange("Member", e.target.value)}
            >
              {memberTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {LEFT_FIELDS.map((f) => (
            <Field
              key={f.name}
              name={f.name}
              label={f.label}
              value={form[f.name]}
              onFieldChange={onFieldChange}
            />
          ))}
        </div>

        {/* Right column: book/loan entries */}
        <div className={styles.column}>
          {RIGHT_FIELDS.map((f) => (
            <Field
              key={f.name}
              name={f.name}
              label={f.label}
              value={form[f.name]}
              onFieldChange={onFieldChange}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
