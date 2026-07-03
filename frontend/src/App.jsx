/**
 * App
 *
 * Root component. The desktop app is a single screen, so App simply renders
 * the LibraryPage. (No router: the original has no additional pages, and the
 * brief says not to add unnecessary pages.)
 */

import LibraryPage from "./pages/LibraryPage.jsx";

export default function App() {
  return <LibraryPage />;
}
