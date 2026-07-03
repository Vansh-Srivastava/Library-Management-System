/**
 * components/Header
 *
 * The green-on-powder-blue title banner from the desktop app. Purely
 * presentational: renders the fixed title text with the desktop styling.
 * Title is overridable via prop but defaults to the original text.
 */

import styles from "./Header.module.css";

export default function Header({ title = "LIBRARY MANAGEMENT SYSTEM" }) {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{title}</h1>
    </header>
  );
}
