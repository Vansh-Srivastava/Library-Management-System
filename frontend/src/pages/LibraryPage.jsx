/**
 * pages/LibraryPage
 *
 * The composition layer. Calls the useLibrary hook and wires its state and
 * actions to the six presentational components, reproducing the desktop
 * layout and workflow:
 *
 *   Header
 *   [ MembershipForm | BookList ]
 *   ButtonPanel
 *   LibraryTable
 *   Notification
 *
 * Interactions mirror the desktop:
 *   - Click a book title  -> selectBook (autofill the form)
 *   - Click a table row   -> selectRow (fill the form; enables Update/Delete)
 *   - Add/Update/Delete/Reset/Exit -> hook actions
 *   - Show Data -> dump the current form into the BookList text area
 */

import { useState } from "react";

import Header from "../components/Header";
import MembershipForm from "../components/MembershipForm";
import BookList from "../components/BookList";
import ButtonPanel from "../components/ButtonPanel";
import LibraryTable from "../components/LibraryTable";
import Notification from "../components/Notification";
import useLibrary from "../hooks/useLibrary.js";

import styles from "./LibraryPage.module.css";

export default function LibraryPage() {
  const {
    form,
    loans,
    books,
    loading,
    notice,
    setField,
    resetForm,
    clearNotice,
    selectBook,
    selectRow,
    showData,
    addRecord,
    updateRecord,
    deleteRecord,
  } = useLibrary();

  // The BookList text area shows the "Show Data" dump on demand.
  const [showText, setShowText] = useState("");

  const handleShow = () => setShowText(showData());

  // Reset also clears the text dump, matching the desktop reset().
  const handleReset = () => {
    resetForm();
    setShowText("");
  };

  // Desktop "Exit": there's no window to destroy in a browser tab, so we clear
  // the form and notify. (Closing the tab is the browser's job.)
  const handleExit = () => {
    handleReset();
    clearNotice();
  };

  return (
    <div className={styles.page}>
      <Header />

      <div className={styles.content}>
        <div className={styles.mainRow}>
          <MembershipForm form={form} onFieldChange={setField} />
          <BookList
            books={books}
            onSelectBook={selectBook}
            showText={showText}
            loading={loading.books}
          />
        </div>

        <ButtonPanel
          onAdd={addRecord}
          onShow={handleShow}
          onUpdate={updateRecord}
          onDelete={deleteRecord}
          onReset={handleReset}
          onExit={handleExit}
          disabled={loading.saving}
        />

        <LibraryTable
          loans={loans}
          onRowClick={selectRow}
          selectedId={form.id}
          loading={loading.loans}
        />
      </div>

      <Notification notice={notice} onClose={clearNotice} />
    </div>
  );
}
