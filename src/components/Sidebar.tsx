import { Link, useLocation } from "react-router-dom";

function Sidebar() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div
      className="sidebar dark:bg-coal-600 bg-light border-r border-r-gray-200 dark:border-r-coal-100 fixed top-0 bottom-0 z-20 hidden lg:flex flex-col items-stretch shrink-0"
      id="sidebar"
    >
      {/* Header */}
      <div
        className="sidebar-header hidden lg:flex items-center relative justify-between px-3 lg:px-6 shrink-0"
        id="sidebar_header"
      >
        <a className="dark:hidden" href="/">
          <img
            className="default-logo min-h-[22px] max-w-none"
            src="/media/app/default-logo.svg"
          />
          <img
            className="small-logo min-h-[22px] max-w-none"
            src="/media/app/mini-logo.svg"
          />
        </a>
        <a className="hidden dark:block" href="/">
          <img
            className="default-logo min-h-[22px] max-w-none"
            src="/media/app/default-logo-dark.svg"
          />
          <img
            className="small-logo min-h-[22px] max-w-none"
            src="/media/app/mini-logo.svg"
          />
        </a>
      </div>

      {/* Content */}
      <div className="sidebar-content flex grow shrink-0 py-5 pr-2" id="sidebar_content">
        <div
          className="scrollable-y-hover grow shrink-0 flex pl-2 lg:pl-5 pr-1 lg:pr-3"
          data-scrollable="true"
          id="sidebar_scrollable"
        >
          <div
            className="menu flex flex-col grow gap-0.5"
            data-menu="true"
            data-menu-accordion-expand-all="false"
            id="sidebar_menu"
          >
            {/* Trade Finance (Parent Menu) */}
            <div
              className="menu-item"
              data-menu-item-toggle="accordion"
              data-menu-item-trigger="click"
            >
              <div
                className="menu-link flex items-center grow cursor-pointer border border-transparent gap-[10px] pl-[10px] pr-[10px] py-[6px]"
                tabIndex={0}
              >
                <span className="menu-icon items-start text-gray-500 dark:text-gray-400 w-[20px]">
                  <i className="ki-filled ki-briefcase text-lg"></i>
                </span>
                <span className="menu-title text-sm font-semibold text-gray-700">
                  TF Genie
                </span>
                <span className="menu-arrow text-gray-400 w-[20px] shrink-0 justify-end ml-1 mr-[-10px]">
                  <i className="ki-filled ki-plus text-2xs menu-item-show:hidden"></i>
                  <i className="ki-filled ki-minus text-2xs hidden menu-item-show:inline-flex"></i>
                </span>
              </div>

              {/* OCR Sub-menu */}
              <div className="menu-accordion gap-0.5 pl-[10px] relative before:absolute before:left-[20px] before:top-0 before:bottom-0 before:border-l before:border-gray-200">
                <div
                  className="menu-item"
                  data-menu-item-toggle="accordion"
                  data-menu-item-trigger="click"
                >
                  <div
                    className="menu-link flex items-center grow cursor-pointer border border-transparent gap-[10px] pl-[10px] pr-[10px] py-[6px]"
                    tabIndex={0}
                  >
                    <span className="menu-icon items-start text-gray-500 dark:text-gray-400 w-[20px]">
                      <i className="ki-filled ki-document text-lg"></i>
                    </span>
                    <span className="menu-title text-sm font-semibold text-gray-700">
                      Discrepancy Finder
                    </span>
                    <span className="menu-arrow text-gray-400 w-[20px] shrink-0 justify-end ml-1 mr-[-10px]">
                      <i className="ki-filled ki-plus text-2xs menu-item-show:hidden"></i>
                      <i className="ki-filled ki-minus text-2xs hidden menu-item-show:inline-flex"></i>
                    </span>
                  </div>

                  {/* OCR -> Dashboard & Sessions */}
                  <div className="menu-accordion gap-0.5 pl-[10px] relative before:absolute before:left-[20px] before:top-0 before:bottom-0 before:border-l before:border-gray-200">
                    {/* Dashboard */}
                    <div className="menu-item">
                      <Link
                        to="/tf_genie/discrepancy/dashboard"
                        className={`menu-link gap-[5px] pl-[10px] pr-[10px] py-[8px] border border-transparent items-center grow hover:bg-secondary-active hover:rounded-lg
                          ${isActive("/tf_genie/discrepancy/dashboard")
                            ? "bg-secondary-active text-primary font-semibold"
                            : "text-gray-700"
                          }`}
                      >
                        <span className="menu-bullet flex w-[6px] relative before:absolute before:top-0 before:size-[6px] before:rounded-full before:-translate-x-1/2 before:-translate-y-1/2 before:bg-primary"></span>
                        <span className="menu-title text-2sm font-medium">Dashboard</span>
                      </Link>
                    </div>

                    {/* Sessions */}
                    <div className="menu-item">
                      <Link
                        to="/tf_genie/discrepancy/create-session"
                        className={`menu-link gap-[5px] pl-[10px] pr-[10px] py-[8px] border border-transparent items-center grow hover:bg-secondary-active hover:rounded-lg
                          ${isActive("/tf_genie/discrepancy/create-session")
                            ? "bg-secondary-active text-primary font-semibold"
                            : "text-gray-700"
                          }`}
                      >
                        <span className="menu-bullet flex w-[6px] relative before:absolute before:top-0 before:size-[6px] before:rounded-full before:-translate-x-1/2 before:-translate-y-1/2 before:bg-primary"></span>
                        <span className="menu-title text-2sm font-medium">Create Sessions</span>
                      </Link>
                    </div>

                    {/* OCR Factory */}
                    <div className="menu-item">
                      <Link
                        to="/tf_genie/discrepancy/ocr-factory"
                        className={`menu-link gap-[5px] pl-[10px] pr-[10px] py-[8px] border border-transparent items-center grow hover:bg-secondary-active hover:rounded-lg
                          ${isActive("/tf_genie/discrepancy/ocr-factory")
                            ? "bg-secondary-active text-primary font-semibold"
                            : "text-gray-700"
                          }`}
                      >
                        <span className="menu-bullet flex w-[6px] relative before:absolute before:top-0 before:size-[6px] before:rounded-full before:-translate-x-1/2 before:-translate-y-1/2 before:bg-primary"></span>
                        <span className="menu-title text-2sm font-medium">OCR Factory</span>
                      </Link>
                    </div>

                    {/* Sub Control Center */}
                    {/* <div className="menu-item">
                      <Link
                        to="/tf_genie/discrepancy/control-center"
                        className={`menu-link gap-[5px] pl-[10px] pr-[10px] py-[8px] border border-transparent items-center grow hover:bg-secondary-active hover:rounded-lg
                          ${isActive("/tf_genie/discrepancy/control-center")
                            ? "bg-secondary-active text-primary font-semibold"
                            : "text-gray-700"
                          }`}
                      >
                        <span className="menu-bullet flex w-[6px] relative before:absolute before:top-0 before:size-[6px] before:rounded-full before:-translate-x-1/2 before:-translate-y-1/2 before:bg-primary"></span>
                        <span className="menu-title text-2sm font-medium">Sub Control Center</span>
                      </Link>
                    </div> */}

                    {/* Vessel Tracking */}
                    {/* <div className="menu-item">
                      <Link
                        to="/tf_genie/discrepancy/vessels"
                        className={`menu-link gap-[5px] pl-[10px] pr-[10px] py-[8px] border border-transparent items-center grow hover:bg-secondary-active hover:rounded-lg
                          ${isActive("/tf_genie/discrepancy/vessels")
                            ? "bg-secondary-active text-primary font-semibold"
                            : "text-gray-700"
                          }`}
                      >
                        <span className="menu-bullet flex w-[6px] relative before:absolute before:top-0 before:size-[6px] before:rounded-full before:-translate-x-1/2 before:-translate-y-1/2 before:bg-primary"></span>
                        <span className="menu-title text-2sm font-medium">Vessel Tracking</span>
                      </Link>
                    </div> */}



                  </div>
                </div>
              </div>
            </div>

            {/* Administration */}
            {/* <div
              className="menu-item mt-3"
              data-menu-item-toggle="accordion"
              data-menu-item-trigger="click"
            >
              <div
                className="menu-link flex items-center grow cursor-pointer border border-transparent gap-[10px] pl-[10px] pr-[10px] py-[6px]"
                tabIndex={0}
              >
                <span className="menu-icon items-start text-gray-500 dark:text-gray-400 w-[20px]">
                  <i className="ki-filled ki-setting-2 text-lg"></i>
                </span>
                <span className="menu-title text-sm font-semibold text-gray-700">
                  Administration
                </span>
                <span className="menu-arrow text-gray-400 w-[20px] shrink-0 justify-end ml-1 mr-[-10px]">
                  <i className="ki-filled ki-plus text-2xs menu-item-show:hidden"></i>
                  <i className="ki-filled ki-minus text-2xs hidden menu-item-show:inline-flex"></i>
                </span>
              </div>

              <div className="menu-accordion gap-0.5 pl-[10px] relative before:absolute before:left-[20px] before:top-0 before:bottom-0 before:border-l before:border-gray-200">
                <div className="menu-item">
                  <Link
                    to="/admin/users"
                    className={`menu-link gap-[5px] pl-[10px] pr-[10px] py-[8px] border border-transparent items-center grow hover:bg-secondary-active hover:rounded-lg
          ${isActive("/administration/users")
                        ? "bg-secondary-active text-primary font-semibold"
                        : "text-gray-700"
                      }`}
                  >
                    <span className="menu-bullet flex w-[6px] relative before:absolute before:top-0 before:size-[6px] before:rounded-full before:-translate-x-1/2 before:-translate-y-1/2 before:bg-primary"></span>
                    <span className="menu-title text-2sm font-medium">Users</span>
                  </Link>
                </div>

                <div className="menu-item">
                  <Link
                    to="/admin/roles"
                    className={`menu-link gap-[5px] pl-[10px] pr-[10px] py-[8px] border border-transparent items-center grow hover:bg-secondary-active hover:rounded-lg
          ${isActive("/administration/roles")
                        ? "bg-secondary-active text-primary font-semibold"
                        : "text-gray-700"
                      }`}
                  >
                    <span className="menu-bullet flex w-[6px] relative before:absolute before:top-0 before:size-[6px] before:rounded-full before:-translate-x-1/2 before:-translate-y-1/2 before:bg-primary"></span>
                    <span className="menu-title text-2sm font-medium">Roles</span>
                  </Link>
                </div>
              </div>
            </div> */}

          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
