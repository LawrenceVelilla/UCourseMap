const SuggestionSkeleton = () => {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <div
          key={`skeleton-${i}`}
          className="px-4 py-2 flex justify-between items-center animate-pulse"
        >
          <div className="flex flex-col gap-2 w-full">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-3/4"></div>
          </div>
        </div>
      ))}
    </>
  );
};
