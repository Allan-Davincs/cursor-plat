import { Link } from "react-router-dom";
import AnimatedPage from "../components/AnimatedPage";

function NotFoundPage() {
  return (
    <AnimatedPage>
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Page not found</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-300">
          The page you requested does not exist.
        </p>
        <Link
          to="/"
          className="mt-4 inline-flex rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
        >
          Return home
        </Link>
      </div>
    </AnimatedPage>
  );
}

export default NotFoundPage;
