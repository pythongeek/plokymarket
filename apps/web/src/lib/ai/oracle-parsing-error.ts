/**
 * Oracle Parsing Error — thrown when MiniMax response cannot be parsed as valid JSON
 * with the required oracle resolution schema.
 */
export class OracleParsingError extends Error {
  public readonly rawResponse: string;
  public readonly parseAttempt: string;

  constructor(rawResponse: string, parseAttempt?: string) {
    super(
      `OracleParsingError: MiniMax returned unparseable JSON. ` +
      `Raw: ${rawResponse.slice(0, 200)}${rawResponse.length > 200 ? '...' : ''}`
    );
    this.name = 'OracleParsingError';
    this.rawResponse = rawResponse;
    this.parseAttempt = parseAttempt || 'JSON.parse';
  }
}
