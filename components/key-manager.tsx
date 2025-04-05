import React from 'react';

export interface ApiKey {
  id: string;
  name: string;
  provider: string;
  value: string;
  createdAt: string;
}

type KeyWithoutValue = Omit<ApiKey, 'value'>;

// Define proper interfaces for props and state
interface KeyManagerProps {
  onClose: () => void;
}

interface KeyManagerState {
  keys: KeyWithoutValue[];
  loading: boolean;
  error: string | null;
  providerFilter: string;
  showAddKey: boolean;
  newKeyName: string;
  newKeyProvider: string;
  newKeyValue: string;
}

// KeyManager component using standard React patterns
export class KeyManager extends React.Component<KeyManagerProps, KeyManagerState> {
  state: KeyManagerState;
  private readonly _props: KeyManagerProps;

  constructor(props: KeyManagerProps) {
    super(props);
    this._props = props;

    // Initialize state properly
    this.state = {
      keys: [],
      loading: false,
      error: null,
      providerFilter: '',
      showAddKey: false,
      newKeyName: '',
      newKeyProvider: 'OpenAI',
      newKeyValue: ''
    };

    // Bind methods
    this.handleAddKey = this.handleAddKey.bind(this);
    this.handleRemoveKey = this.handleRemoveKey.bind(this);
    this.handleToggleAddKey = this.handleToggleAddKey.bind(this);
    this.handleProviderFilterChange = this.handleProviderFilterChange.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleClose = this.handleClose.bind(this);
  }

  componentDidMount() {
    // Load keys when component mounts
    this.loadKeys();
  }

  async loadKeys() {
    this.setState({ loading: true, error: null });

    try {
      const response = await fetch('/api/admin/keys');
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      this.setState({
        keys: data.keys,
        loading: false
      });
    } catch (error) {
      console.error('Failed to load keys:', error);
      this.setState({
        error: `Failed to load keys: ${error instanceof Error ? error.message : String(error)}`,
        loading: false
      });
    }
  }

  async handleAddKey() {
    const { newKeyName, newKeyProvider, newKeyValue } = this.state;

    if (!newKeyName || !newKeyProvider || !newKeyValue) {
      this.setState({ error: 'All fields are required' });
      return;
    }

    this.setState({ loading: true, error: null });

    try {
      const response = await fetch('/api/admin/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newKeyName,
          provider: newKeyProvider,
          value: newKeyValue,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      // Clear form and reload keys
      this.setState({
        newKeyName: '',
        newKeyProvider: 'OpenAI',
        newKeyValue: '',
        showAddKey: false,
      }, () => {
        // Reload keys after state update
        this.loadKeys();
      });
    } catch (error) {
      console.error('Failed to add key:', error);
      this.setState({
        error: `Failed to add key: ${error instanceof Error ? error.message : String(error)}`,
        loading: false
      });
    }
  }

  async handleRemoveKey(id: string) {
    if (confirm('Are you sure you want to remove this API key?')) {
      this.setState({ loading: true, error: null });

      try {
        const response = await fetch(`/api/admin/keys/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        // Reload keys
        this.loadKeys();
      } catch (error) {
        console.error('Failed to remove key:', error);
        this.setState({
          error: `Failed to remove key: ${error instanceof Error ? error.message : String(error)}`,
          loading: false
        });
      }
    }
  }

  handleToggleAddKey() {
    const { showAddKey } = this.state;

    if (showAddKey) {
      // Reset form when hiding
      this.setState({
        showAddKey: false,
        newKeyName: '',
        newKeyProvider: 'OpenAI',
        newKeyValue: ''
      });
    } else {
      this.setState({ showAddKey: true });
    }
  }

  handleProviderFilterChange(event: React.ChangeEvent<HTMLSelectElement>) {
    this.setState({ providerFilter: event.target.value });
  }

  handleInputChange(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;

    if (name in this.state) {
      this.setState(prevState => ({
        ...prevState,
        [name]: value,
      } as unknown as KeyManagerState));
    }
  }


  handleClose() {
    // Use the private props field to avoid TypeScript errors
    if (this._props.onClose) {
      this._props.onClose();
    }
  }

  getFilteredKeys(): KeyWithoutValue[] {
    const state = this.state as KeyManagerState;
    const { keys, providerFilter } = state;

    if (!providerFilter) {
      return keys;
    }

    return keys.filter(key => key.provider === providerFilter);
  }

  render() {
    const state = this.state as KeyManagerState;
    const { loading, error, showAddKey, newKeyName, newKeyProvider, newKeyValue, providerFilter } = state;
    const filteredKeys = this.getFilteredKeys();

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-100 rounded-xl shadow-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">API Key Management</h2>
            <button
              onClick={this.handleClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-600 mb-2">
              API keys are stored securely on the server and never exposed to clients.
              Use key references when adding validators instead of raw API keys.
            </p>

            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <label className="text-sm text-gray-600">Filter by provider:</label>
                <select
                  value={providerFilter}
                  onChange={this.handleProviderFilterChange}
                  className="border rounded-md py-1 px-2 text-sm"
                >
                  <option value="">All Providers</option>
                  <option value="OpenAI">OpenAI</option>
                  <option value="Anthropic">Anthropic</option>
                  <option value="Google">Google</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <button
                onClick={this.handleToggleAddKey}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
              >
                {showAddKey ? 'Cancel' : 'Add New Key'}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
              {error}
            </div>
          )}

          {showAddKey && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="text-lg font-medium mb-4 text-gray-800">Add New API Key</h3>

              <div className="grid grid-cols-1 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Key Name
                  </label>
                  <input
                    type="text"
                    name="newKeyName"
                    value={newKeyName}
                    onChange={this.handleInputChange}
                    placeholder="e.g., Production OpenAI Key"
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Provider
                  </label>
                  <select
                    name="newKeyProvider"
                    value={newKeyProvider}
                    onChange={this.handleInputChange}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="OpenAI">OpenAI</option>
                    <option value="Anthropic">Anthropic</option>
                    <option value="Google">Google</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key (stored securely, never exposed to clients)
                  </label>
                  <input
                    type="password"
                    name="newKeyValue"
                    value={newKeyValue}
                    onChange={this.handleInputChange}
                    placeholder="sk-..."
                    className="w-full p-2 border rounded-md"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={this.handleAddKey}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                >
                  {loading ? 'Adding...' : 'Add Key'}
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Key ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Added
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading && !filteredKeys.length ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : filteredKeys.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      No API keys found. {!providerFilter ? '' : 'Try changing the provider filter.'}
                    </td>
                  </tr>
                ) : (
                  filteredKeys.map((key) => (
                    <tr key={key.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {key.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {key.provider}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {key.id.substring(0, 8)}...
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(key.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => this.handleRemoveKey(key.id)}
                          className="text-red-600 hover:text-red-900"
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

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">
                API keys are securely stored on the server and never exposed in responses.
              </p>
              <button
                onClick={this.handleClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
