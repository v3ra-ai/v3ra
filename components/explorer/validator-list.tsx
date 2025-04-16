import React from "react";
import type { Validator } from "@/lib/types";
import { ValidatorProfile } from "@/components/validator-profile";

interface ValidatorListProps {
  validators: Validator[];
  currentLeaderIndex?: number;
}

export function ValidatorList(props: ValidatorListProps) {
  // Handle null or undefined validators
  const validValidators = Array.isArray(props.validators)
    ? props.validators
    : [];

  // State management using direct DOM approach for simplicity
  const [profileState, setProfileState] = React.useState<{
    isOpen: boolean;
    validator: Validator | null;
  }>({
    isOpen: false,
    validator: null,
  });

  // Handle click on validator profile
  const handleValidatorClick = (validator: Validator) => {
    setProfileState({
      isOpen: true,
      validator: validator,
    });
  };

  // Close validator profile modal
  const handleCloseProfile = () => {
    setProfileState({
      isOpen: false,
      validator: null,
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium mb-4">
        Validators ({validValidators.length})
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Profile
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Last Vote
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Rationale
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {validValidators.length > 0 ? (
              validValidators.map((validator, index) => (
                <tr
                  key={validator.id}
                  className={
                    index % 2 === 0 ? "bg-gray-50 dark:bg-gray-900/50" : ""
                  }
                >
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {validator.id}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    <div className="flex flex-col">
                      <button
                        className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-left flex items-center"
                        onClick={() => handleValidatorClick(validator)}
                      >
                        {validator.profileName}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 ml-1 opacity-70"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {validator.provider}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {props.currentLeaderIndex !== undefined &&
                    index === props.currentLeaderIndex ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                        Leader
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        Validator
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {validator.lastVote === null ? (
                      <span className="text-gray-500 dark:text-gray-400">
                        N/A
                      </span>
                    ) : validator.lastVote ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Yes
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                        No
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 max-w-md">
                    {validator.lastRationale || (
                      <span className="text-gray-400 dark:text-gray-500 italic">
                        No rationale available
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-3 text-sm text-center text-gray-500 dark:text-gray-400"
                >
                  No validators available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Validator Profile Modal */}
      {profileState.isOpen && (
        <ValidatorProfile
          validator={profileState.validator}
          isOpen={profileState.isOpen}
          onClose={handleCloseProfile}
        />
      )}
    </div>
  );
}
