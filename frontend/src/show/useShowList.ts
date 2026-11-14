import { USE_BACKEND } from "@/api/config";
import { useLiveShowList } from "./useLiveShowList";
import { useMockShowList } from "./useMockShowList";

export const useShowList = USE_BACKEND ? useLiveShowList : useMockShowList;
