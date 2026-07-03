/**
 * components/LibraryTable
 *
 * The desktop bottom table: every record, scrollable, with the 18 desktop
 * columns in order. Clicking a row fills the form (desktop get_cursor).
 *
 * Presentational -- driven by props from the useLibrary hook:
 *   loans        array of flat 18-field loan rows
 *   onRowClick   (row) => void   called when a row is clicked
 *   selectedId   id of the currently selected row (for highlight)
 *   loading      optional boolean -> shows a loading hint
 *
 * Column keys match the flat API field names; headers match the desktop
 * Treeview heading labels exactly.
 */

import styles from "./LibraryTable.module.css";

// { key: API field, label: desktop heading } in desktop column order.
const COLUMNS = [
  { key: "Member", label: "Member Type" },
  { key: "PRN_NO", label: "PRN No." },
  { key: "ID", label: "ID.NO" },
  { key: "FirstName", label: "First Name" },
  { key: "LastName", label: "Last Name" },
  { key: "Address1", label: "Address1" },
  { key: "Address2", label: "Address2" },
  { key: "PostId", label: "Post ID" },
  { key: "Mobile", label: "Mobile No." },
  { key: "BookId", label: "Book ID" },
  { key: "BookTitle", label: "Book Title" },
  { key: "Auther", label: "Auther" },
  { key: "Dateborrowed", label: "Date Of Borrowerd" },
  { key: "DateDue", label: "Date Due" },
  { key: "DayOnBook", label: "DaysOnBook" },
  { key: "LaterReturnFine", label: "LateReturnFine" },
  { key: "DateOverDue", label: "DateOverDue" },
  { key: "FinalPrice", label: "Final Price" },
];

export default function LibraryTable({
  loans = [],
  onRowClick,
  selectedId = null,
  loading = false,
}) {
  return (
    <div className={styles.frame} aria-label="Library records">
      <div className={styles.scroll}>
        {loading ? (
          <div className={styles.empty}>Loading records…</div>
        ) : loans.length === 0 ? (
          <div className={styles.empty}>No records to display.</div>
        ) : (
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                {COLUMNS.map((c) => (
                  <th key={c.key}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loans.map((row) => {
                const isSelected = row.id != null && row.id === selectedId;
                return (
                  <tr
                    key={row.id}
                    className={`${styles.row} ${isSelected ? styles.rowSelected : ""}`}
                    onClick={() => onRowClick && onRowClick(row)}
                  >
                    {COLUMNS.map((c) => (
                      <td key={c.key}>{row[c.key] ?? ""}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
