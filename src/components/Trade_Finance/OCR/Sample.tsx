 {/* Input Fields */}
        <div className="space-y-4">
          <div className="flex space-x-4">
            {/* CIF Number */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                CIF Number *
              </label>
              <input
                type="text"
                value={newSession.cifNumber}
                onChange={(e) =>
                  setNewSession((prev) => ({ ...prev, cifNumber: e.target.value }))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter CIF number"
              />
            </div>

            {/* Customer Name */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Customer Name *
              </label>
              <input
                type="text"
                value={newSession.cusName}
                onChange={(e) =>
                  setNewSession((prev) => ({ ...prev, cusName: e.target.value }))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter Customer Name"
              />
            </div>

            {/* Customer Category */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Customer Category *
              </label>
              <input
                type="text"
                value={newSession.cusCategory}
                onChange={(e) =>
                  setNewSession((prev) => ({ ...prev, cusCategory: e.target.value }))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter Customer Category"
              />
            </div>
          </div>


          <div className="flex space-x-4">
            {/* LC Number */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                LC Number *
              </label>
              <input
                type="text"
                value={newSession.lcNumber}
                onChange={(e) =>
                  setNewSession((prev) => ({ ...prev, lcNumber: e.target.value }))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter LC number"
              />
            </div>

            {/* Instrument Type */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Instrument Type *
              </label>
              <input
                list="instrument-options"
                value={newSession.instrument}
                onChange={(e) =>
                  setNewSession((prev) => ({
                    ...prev,
                    instrument: e.target.value,
                    lifecycle: "", // reset lifecycle when instrument changes
                  }))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Select Instrument Type"
              />
              <datalist id="instrument-options">
                {uniqueInstruments.map((inst, index) => (
                  <option key={index} value={inst} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Lifecycle */}
          {/* Lifecycle */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Lifecycle *
            </label>

            <input
              list="lifecycle-options"
              value={newSession.lifecycle}
              onChange={(e) =>
                setNewSession((prev) => ({
                  ...prev,
                  lifecycle: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Select or enter lifecycle"
            />

            <datalist id="lifecycle-options">
              {lifecycles
                .filter((item) => item.instrument === newSession.instrument) // match selected instrument
                .map((item) => (
                  <option key={item.id} value={item.transition} />
                ))}
            </datalist>
          </div>



        </div>




function Header() {
  return (
    <header
      className="header fixed top-0 z-10 left-0 right-0 flex items-stretch shrink-0 bg-[#fefefe] dark:bg-coal-500"
      data-sticky="true"
      data-sticky-class="shadow-sm dark:border-b dark:border-b-coal-100"
      data-sticky-name="header"
      id="header"
    >
      {/* begin: container */}
      <div
        className="container-fixed flex justify-between items-stretch lg:gap-4"
        id="header_container"
      >
        <div className="flex gap-1 lg:hidden items-center -ml-1">
          <a className="shrink-0" href="html/demo1.html">
            <img className="max-h-[25px] w-full" src="/media/app/mini-logo.svg" />
          </a>
          <div className="flex items-center">
            <button
              className="btn btn-icon btn-light btn-clear btn-sm"
              data-drawer-toggle="#sidebar"
            >
              <i className="ki-filled ki-menu"></i>
            </button>
            <button
              className="btn btn-icon btn-light btn-clear btn-sm"
              data-drawer-toggle="#megamenu_wrapper"
            >
              <i className="ki-filled ki-burger-menu-2"></i>
            </button>
          </div>
        </div>
        <div className="flex items-stretch" id="megamenu_container">
          <div
            className="flex items-stretch"
            data-reparent="true"
            data-reparent-mode="prepend|lg:prepend"
            data-reparent-target="body|lg:#megamenu_container"
          >
            <div
              className="hidden lg:flex lg:items-stretch"
              data-drawer="true"
              data-drawer-class="drawer drawer-start fixed z-10 top-0 bottom-0 w-full mr-5 max-w-[250px] p-5 lg:p-0 overflow-auto"
              data-drawer-enable="true|lg:false"
              id="megamenu_wrapper"
            >
              <div
                className="menu flex-col lg:flex-row gap-5 lg:gap-7.5"
                data-menu="true"
                id="megamenu"
              >
                {/* 1. Dashboard */}
                <div className="menu-item">
                  <a
                    className="menu-link text-nowrap text-sm text-gray-700 font-medium menu-item-hover:text-primary menu-item-active:text-gray-900 menu-item-active:font-semibold"
                    href="/tf_genie/discrepancy/dashboard"
                  >
                    <span className="menu-title text-nowrap">Dashboard</span>
                  </a>
                </div>

                {/* 2. Create Session */}
                <div className="menu-item">
                  <a
                    className="menu-link text-nowrap text-sm text-gray-700 font-medium menu-item-hover:text-primary menu-item-active:text-gray-900 menu-item-active:font-semibold"
                    href="/tf_genie/discrepancy/create-session"
                  >
                    <span className="menu-title text-nowrap">Create Session</span>
                  </a>
                </div>

                {/* 3. OCR */}
                <div className="menu-item">
                  <a
                    className="menu-link text-nowrap text-sm text-gray-700 font-medium menu-item-hover:text-primary menu-item-active:text-gray-900 menu-item-active:font-semibold"
                    href="/tf_genie/discrepancy/ocr-factory"
                  >
                    <span className="menu-title text-nowrap">OCR</span>
                  </a>
                </div>

                {/* 4. SS */}
                <div className="menu-item">
                  <a
                    className="menu-link text-nowrap text-sm text-gray-700 font-medium menu-item-hover:text-primary menu-item-active:text-gray-900 menu-item-active:font-semibold"
                    href="/tf_genie/discrepancy/control-center"
                  >
                    <span className="menu-title text-nowrap">Sub Control Center</span>
                  </a>
                </div>

                {/* 5. Vessel Tracking */}
                <div className="menu-item">
                  <a
                    className="menu-link text-nowrap text-sm text-gray-700 font-medium menu-item-hover:text-primary menu-item-active:text-gray-900 menu-item-active:font-semibold"
                    href="/tf_genie/discrepancy/vessels"
                  >
                    <span className="menu-title text-nowrap">Vessel Tracking</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* other header content can go here */}
      </div>
    </header>
  );
}

export default Header;