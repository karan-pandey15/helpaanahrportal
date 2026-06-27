import { Dialog, Transition, Combobox } from "@headlessui/react";
import { Fragment, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import { fetchInterviewsList } from "@/features/interviews/interviewService";

// Global candidate search. Opens from the header (or Ctrl/Cmd+K), debounces the
// query, and searches candidates by name / email / phone via the existing
// /interview/list endpoint. Selecting a result opens that candidate's profile.
const SearchModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const debounceRef = useRef();

  const closeModal = () => setIsOpen(false);
  const openModal = () => setIsOpen(true);

  // Debounced search whenever the query changes (only while the modal is open).
  useEffect(() => {
    if (!isOpen) return;
    const q = query.trim();
    clearTimeout(debounceRef.current);
    if (!q) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await fetchInterviewsList({ search: q, page: 1, limit: 8 });
        setResults(data?.interviews || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, isOpen]);

  // Clear state when the modal closes.
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      setLoading(false);
    }
  }, [isOpen]);

  // Ctrl/Cmd+K opens the global search from anywhere.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key?.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleSelect = (item) => {
    if (!item?._id) return;
    closeModal();
    navigate(`/candidate/${item._id}`);
  };

  const showEmpty = !loading && query.trim() !== "" && results.length === 0;

  return (
    <>
      <div>
        <button
          className="flex items-center xl:text-sm text-lg xl:text-slate-400 text-slate-800 dark:text-slate-300 px-1 space-x-3 rtl:space-x-reverse"
          onClick={openModal}
        >
          <Icon icon="heroicons-outline:search" />
          <span className="xl:inline-block hidden">Search... </span>
        </button>
      </div>

      <Transition show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-[9999] overflow-y-auto p-4 md:pt-[25vh] pt-20"
          onClose={closeModal}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/60 backdrop-filter backdrop-blur-sm backdrop-brightness-10" />
          </Transition.Child>

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="mx-auto max-w-xl">
              <Combobox value={null} onChange={handleSelect}>
                <div className="relative">
                  <div className="relative mx-auto max-w-xl rounded-md bg-white dark:bg-slate-800 shadow-2xl ring-1 ring-gray-500-500 dark:ring-light divide-y divide-gray-500-300 dark:divide-light">
                    <div className="flex bg-white dark:bg-slate-800 px-3 rounded-md py-3 items-center">
                      <div className="flex-0 text-slate-700 dark:text-slate-300 ltr:pr-2 rtl:pl-2 text-lg">
                        <Icon icon="heroicons-outline:search" />
                      </div>
                      <Combobox.Input
                        autoFocus
                        className="bg-transparent outline-none focus:outline-none border-none w-full flex-1 dark:placeholder:text-slate-300 dark:text-slate-200"
                        placeholder="Search name, email, phone, position, company, round, date…"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                      />
                      {loading && (
                        <Icon
                          icon="heroicons-outline:refresh"
                          className="animate-spin text-slate-400 text-lg"
                        />
                      )}
                    </div>
                    <Transition
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <Combobox.Options
                        static
                        className="max-h-72 overflow-y-auto text-sm py-2"
                      >
                        {query.trim() === "" && (
                          <div className="px-4 py-3 text-slate-400 dark:text-slate-400">
                            Type to search candidates…
                          </div>
                        )}

                        {showEmpty && (
                          <div className="px-4 py-3 text-slate-500 dark:text-white">
                            No candidate found for “{query.trim()}”
                          </div>
                        )}

                        {results.map((item) => (
                          <Combobox.Option key={item._id} value={item}>
                            {({ active }) => (
                              <div
                                className={`px-4 py-2 cursor-pointer ${
                                  active
                                    ? "bg-slate-900 dark:bg-slate-600 dark:bg-opacity-60 text-white"
                                    : "text-slate-900 dark:text-white"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <span className="font-medium capitalize truncate">
                                    {item.candidateName || "—"}
                                  </span>
                                  {item.round && (
                                    <span
                                      className={`text-[11px] px-2 py-0.5 rounded-full capitalize shrink-0 ${
                                        active
                                          ? "bg-white/20 text-white"
                                          : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                                      }`}
                                    >
                                      {item.round}
                                    </span>
                                  )}
                                </div>
                                <div
                                  className={`text-xs truncate ${
                                    active
                                      ? "text-white/80"
                                      : "text-slate-500 dark:text-slate-400"
                                  }`}
                                >
                                  {item.email}
                                  {item.position ? ` · ${item.position}` : ""}
                                </div>
                              </div>
                            )}
                          </Combobox.Option>
                        ))}
                      </Combobox.Options>
                    </Transition>
                  </div>
                </div>
              </Combobox>
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition>
    </>
  );
};

export default SearchModal;
