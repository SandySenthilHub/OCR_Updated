function DataTab() {
  return(
  <div className="card min-w-full">
    <div className="card-header">
      <h3 className="card-title">User Sessions</h3>
    </div>
    <div className="card-table">
      <table
        className="table table-border align-middle text-gray-700 font-medium text-sm"
        id="my_table_2"
      >
        <thead>
          <tr>
            <th className="min-w-[250px]">
              <span className="sort asc">
                <span className="sort-label">Person</span>
                <span className="sort-icon"></span>
              </span>
            </th>
            <th className="min-w-[165px]">
              <span className="sort">
                <span className="sort-label">Browser</span>
                <span className="sort-icon"></span>
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <div className="flex items-center gap-2.5">
                <img
                  alt=""
                  className="h-9 rounded-full"
                  src="/public/media/avatars/300-1.png"
                />
                <a
                  className="leading-none font-semibold text-gray-900 hover:text-primary"
                  href="#"
                >
                  Esther Howard
                </a>
              </div>
            </td>
            <td>
              <div className="flex items-center gap-2">
                <i className="ki-outline ki-chrome text-gray-500 text-lg"></i>
                <span className="text-gray-700">Chrome on Mac OS X</span>
              </div>
            </td>
          </tr>
          <tr>
            <td>
              <div className="flex items-center gap-2.5">
                <img
                  alt=""
                  className="h-9 rounded-full"
                  src="/static/metronic/tailwind/docs/dist/assets/media/avatars/300-2.png"
                />
                <a
                  className="leading-none font-semibold text-gray-900 hover:text-primary"
                  href="#"
                >
                  Tyler Hero
                </a>
              </div>
            </td>
            <td>
              <div className="flex items-center gap-2">
                <i className="ki-outline ki-chrome text-gray-500 text-lg"></i>
                <span className="text-gray-700">Chrome on Windows 7</span>
              </div>
            </td>
          </tr>
          <tr>
            <td>
              <div className="flex items-center gap-2.5">
                <img
                  alt=""
                  className="h-9 rounded-full"
                  src="/static/metronic/tailwind/docs/dist/assets/media/avatars/300-5.png"
                />
                <a
                  className="leading-none font-semibold text-gray-900 hover:text-primary"
                  href="#"
                >
                  Leslie Alexander
                </a>
              </div>
            </td>
            <td>
              <div className="flex items-center gap-2">
                <i className="ki-outline ki-chrome text-gray-500 text-lg"></i>
                <span className="text-gray-700">Chrome on Mac OS X</span>
              </div>
            </td>
          </tr>
          <tr>
            <td>
              <div className="flex items-center gap-2.5">
                <img
                  alt=""
                  className="h-9 rounded-full"
                  src="/static/metronic/tailwind/docs/dist/assets/media/avatars/300-6.png"
                />
                <a
                  className="leading-none font-semibold text-gray-900 hover:text-primary"
                  href="#"
                >
                  Brooklyn Simmons
                </a>
              </div>
            </td>
            <td>
              <div className="flex items-center gap-2">
                <i className="ki-outline ki-chrome text-gray-500 text-lg"></i>
                <span className="text-gray-700">Chrome on Windows 10</span>
              </div>
            </td>
          </tr>
          <tr>
            <td>
              <div className="flex items-center gap-2.5">
                <img
                  alt=""
                  className="h-9 rounded-full"
                  src="/static/metronic/tailwind/docs/dist/assets/media/avatars/300-7.png"
                />
                <a
                  className="leading-none font-semibold text-gray-900 hover:text-primary"
                  href="#"
                >
                  Darlene Robertson
                </a>
              </div>
            </td>
            <td>
              <div className="flex items-center gap-2">
                <i className="ki-outline ki-chrome text-gray-500 text-lg"></i>
                <span className="text-gray-700">Chrome on Mac OS X</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>);
}

export default DataTab;
