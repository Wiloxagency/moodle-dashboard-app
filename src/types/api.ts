// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}

// Course Types
export interface SimplifiedCourse {
  id: number;
  fullname: string;
  startdate: number;
  enddate: number;
  students: number;
}

export interface SimplifiedCoursesResponse {
  categoryId: number;
  courses: SimplifiedCourse[];
  total: number;
  warnings: Warning[];
}

export interface Course {
  id: number;
  fullname: string;
  displayname: string;
  shortname: string;
  courseimage: string;
  categoryid: number;
  categoryname: string;
  sortorder: number;
  summary: string;
  summaryformat: number;
  format: string;
  showgrades: number;
  newsitems: number;
  startdate: number;
  enddate: number;
  numsections: number;
  maxbytes: number;
  showreports: number;
  visible: number;
  hiddensections: number;
  groupmode: number;
  groupmodeforce: number;
  defaultgroupingid: number;
  timecreated: number;
  timemodified: number;
  enablecompletion: number;
  completionnotify: number;
  lang: string;
  forcetheme: string;
  courseformatoptions: Array<{
    name: string;
    value: number | string;
  }>;
}

export interface CoursesResponse {
  categoryId: number;
  courses: Course[];
  total: number;
  warnings: Warning[];
}

// Category Types
export interface Category {
  id: number;
  name: string;
  idnumber: string;
  description: string;
  descriptionformat: number;
  parent: number;
  sortorder: number;
  coursecount: number;
  visible: number;
  visibleold: number;
  timemodified: number;
  depth: number;
  path: string;
  theme?: string;
}

export interface CategoriesResponse {
  parentId?: number;
  categories: Category[];
  total: number;
  warnings: Warning[];
}

// Common Types
export interface Warning {
  item: string;
  itemid: number;
  warningcode: string;
  message: string;
}

// API Health Check
export interface HealthCheckResponse {
  success: boolean;
  message: string;
  timestamp: string;
  moodle: {
    connected: boolean;
    siteInfo: any;
  };
}
