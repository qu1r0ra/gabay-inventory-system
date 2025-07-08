import React, { createContext, useContext, useState } from "react";

type SearchContextType = {
  query: string;
  setQuery: (val: string) => void;
};

const SearchContext = createContext<SearchContextType>({
  query: "",
  setQuery: () => {},
});

export const useSearch = () => useContext(SearchContext);

export const SearchProvider = ({ children }: { children: React.ReactNode }) => {
  const [query, setQuery] = useState("");

  return (
    <SearchContext.Provider value={{ query, setQuery }}>
      {children}
    </SearchContext.Provider>
  );
};
