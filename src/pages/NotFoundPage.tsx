export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary">404</h1>
        <h2 className="text-4xl font-bold mt-4 mb-2">Page Not Found</h2>
        <p className="text-lg opacity-70 mb-8">
          The page you're looking for doesn't exist.
        </p>
        <a href="/#/admin" className="btn btn-primary">
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}
