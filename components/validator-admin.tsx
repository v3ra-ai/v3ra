import * as React from 'react';
import { KeyManager } from './key-manager';
import { Switch } from '@headlessui/react';

interface Validator {
  id: string;
  provider: string;
  modelName: string;
  profileName: string;
  active: boolean;
  validatorType?: string;
}

interface ApiKey {
  id: string;
  name: string;
  provider: string;
  value: string;
}

type RawKey = {
  id: string;
  name: string;
  provider: string;
  key?: string;
  value?: string;
};

interface ValidatorAdminProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ValidatorAdmin({ isOpen, onClose }: ValidatorAdminProps) {
  const [validators, setValidators] = React.useState<Validator[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [newProvider, setNewProvider] = React.useState('OpenAI');
  const [newModelName, setNewModelName] = React.useState('');
  const [newKeyId, setNewKeyId] = React.useState('');
  const [availableKeys, setAvailableKeys] = React.useState<ApiKey[]>([]);
  const [showKeyManager, setShowKeyManager] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      loadValidators();
      loadAvailableKeys();
    }
  }, [isOpen]);

  const loadValidators = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/validators');
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setValidators(data || []);
    } catch (err) {
      const errorMessage = `Failed to load validators: ${err instanceof Error ? err.message : String(err)}`;
      setError(errorMessage);
      console.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableKeys = async () => {
    try {
      const response = await fetch('/api/admin/keys');
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      // Handle both possible structures
      const keys = Array.isArray(data)
      ? data.map((k: RawKey) => ({
          id: k.id,
          name: k.name,
          provider: k.provider,
          value: k.key || ''
        }))
      : (data.keys || []).map((k: RawKey) => ({
          id: k.id,
          name: k.name,
          provider: k.provider,
          value: k.value || k.key || ''
        }));
      setAvailableKeys(keys);
    } catch (err) {
      console.error(`Failed to load API keys: ${err instanceof Error ? err.message : String(err)}`);
      setAvailableKeys([]);
    }
  };

  // Add new validator
  const handleAddValidator = async () => {
    if (!newProvider || !newModelName) {
      setError('Provider and model name are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/validators/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: newProvider,
          modelName: newModelName,
          keyId: newKeyId || undefined
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Error ${response.status}: ${text}`);
      }

      const data = await response.json();
      console.log("Validator added:", data.validator);  // Use data
      setNewProvider('OpenAI');
      setNewModelName('');
      setNewKeyId('');
      await loadValidators();
    } catch (err) {
      const errorMessage = `Failed to add validator: ${err instanceof Error ? err.message : String(err)}`;
      setError(errorMessage);
      console.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Toggle validator active state
  const handleToggleValidator = async (id: string, active: boolean) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/validators/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, active })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || `Error ${response.status}`);
      }

      // Reload validators to reflect the change
      await loadValidators();
    } catch (err) {
      const errorMessage = `Failed to toggle validator: ${err instanceof Error ? err.message : String(err)}`;
      setError(errorMessage);
      console.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Remove validator
  const handleRemoveValidator = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this validator?')) {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/admin/validators/remove?id=${id}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || `Error ${response.status}`);
        }

        // Reload validators after deletion
        await loadValidators();
      } catch (err) {
        const errorMessage = `Failed to remove validator: ${err instanceof Error ? err.message : String(err)}`;
        setError(errorMessage);
        console.error(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  // Remove all inactive validators
  const handleRemoveInactiveValidators = async () => {
    const inactiveValidators = validators.filter((v: Validator) => !v.active);
    if (inactiveValidators.length === 0) {
      setError('No inactive validators to remove');
      return;
    }

    if (window.confirm(`Are you sure you want to remove all ${inactiveValidators.length} inactive validators?`)) {
      setLoading(true);
      setError(null);

      try {
        // Call the API endpoint to remove all inactive validators
        const response = await fetch('/api/admin/validators/remove-inactive', {
          method: 'POST'
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || `Error ${response.status}`);
        }

        const result = await response.json();
        console.log(result.message);

        // Reload validators after deletion
        await loadValidators();
      } catch (err) {
        const errorMessage = `Failed to remove inactive validators: ${err instanceof Error ? err.message : String(err)}`;
        setError(errorMessage);
        console.error(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  // Toggle key manager
  const handleToggleKeyManager = () => {
    setShowKeyManager(!showKeyManager);
  };

  // Handle key manager close
  const handleKeyManagerClose = () => {
    setShowKeyManager(false);
    // Reload available keys after key manager is closed
    loadAvailableKeys();
  };

  // Handle input change for provider
  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNewProvider(e.target.value);
  };

  // Handle input change for model name
  const handleModelNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewModelName(e.target.value);
  };

  // Handle input change for API key
  const handleKeyIdChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNewKeyId(e.target.value);
  };

  // Get available keys filtered by provider
  const getFilteredKeys = () => {
    return availableKeys.filter((key: ApiKey) => key.provider === newProvider);
  };

  // If modal is not open, don't render anything
  if (!isOpen) {
    return null;
  }

  const filteredKeys = getFilteredKeys();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl shadow-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-auto border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-200">Manage Validators</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900 text-red-200 rounded-md">
            {error}
          </div>
        )}

        <div className="flex justify-between mb-6">
          <button
            onClick={handleAddValidator}
            disabled={loading || !newKeyId || !newModelName || !newProvider}
            className={`px-4 py-2 rounded ${
              loading || !newKeyId || !newModelName || !newProvider
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {loading ? 'Adding...' : 'Add New Validator'}
          </button>

          <button
            onClick={handleRemoveInactiveValidators}
            disabled={loading || validators.filter((v: Validator) => !v.active).length === 0}
            className={`px-4 py-2 rounded ${
              loading || validators.filter((v: Validator) => !v.active).length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            {loading ? 'Removing...' : 'Remove All Inactive'}
          </button>
        </div>

        <div className="mb-6 p-4 border rounded-lg bg-gray-700 border-gray-600">
          <h3 className="text-lg font-medium mb-4 text-gray-200">Add New Validator</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Provider
              </label>
              <select
                value={newProvider}
                onChange={handleProviderChange}
                className="w-full p-2 border bg-gray-600 text-gray-200 border-gray-600 rounded-md"
              >
                <option value="OpenAI">OpenAI</option>
                <option value="Anthropic">Anthropic</option>
                <option value="Google">Google</option>
                <option value="Grok">Grok</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Model Name
              </label>
              <input
                type="text"
                value={newModelName}
                onChange={handleModelNameChange}
                placeholder={newProvider === 'OpenAI' ? 'gpt-4o' : 'claude-3-opus'}
                className="w-full p-2 border bg-gray-600 text-gray-200 border-gray-600 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                API Key
              </label>
              <div className="flex items-center space-x-2">
                <select
                  value={newKeyId}
                  onChange={handleKeyIdChange}
                  className="w-full p-2 border bg-gray-600 text-gray-200 border-gray-600 rounded-md"
                >
                  <option value="">Use default from .env</option>
                  {filteredKeys.map((key: ApiKey) => (
                    <option key={key.id} value={key.id}>
                      {key.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleToggleKeyManager}
                  title="Manage API Keys"
                  className="p-2 border border-gray-600 bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleAddValidator}
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-600"
          >
            {loading ? 'Adding...' : 'Add Validator'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-1/4">
                  NAME
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  PROVIDER
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  MODEL
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  TYPE
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-24">
                  STATUS
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-32">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {validators.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-4 whitespace-nowrap text-sm text-gray-400 text-center">
                    No validators found. Add one to get started.
                  </td>
                </tr>
              ) : (
                validators.map((validator: Validator) => (
                  <tr key={validator.id} className="hover:bg-gray-700 align-middle">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-200">
                          {validator.profileName}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-400">{validator.provider}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-400">{validator.modelName || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-400">{validator.validatorType || 'Standard'}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <Switch
                        checked={validator.active}
                        onChange={(newActiveState) => handleToggleValidator(validator.id, newActiveState)}
                        className={`${validator.active ? 'bg-blue-600' : 'bg-gray-600'}
                          relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800`}
                        disabled={loading}
                      >
                        <span className="sr-only">Toggle Active Status</span>
                        <span
                          aria-hidden="true"
                          className={`${validator.active ? 'translate-x-5' : 'translate-x-0'}
                            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                        />
                      </Switch>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-left text-sm font-medium">
                      <button
                        onClick={() => handleRemoveValidator(validator.id)}
                        className="text-red-500 hover:text-red-400 disabled:text-gray-500 disabled:cursor-not-allowed"
                        title="Remove Validator"
                        disabled={loading}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 text-center text-sm text-gray-400">
          <p>Validators can be hot-swapped at runtime without restarting the server.</p>
          <div className="mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 mr-2"
            >
              Close
            </button>
            <button
              onClick={handleToggleKeyManager}
              className="px-4 py-2 bg-gray-700 border border-gray-600 text-gray-200 rounded-md hover:bg-gray-600 mr-2"
            >
              Manage API Keys
            </button>
          </div>
        </div>
      </div>

      {showKeyManager && (
        <KeyManager onClose={handleKeyManagerClose} />
      )}
    </div>
  );
}
