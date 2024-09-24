import * as vscode from 'vscode';

let salaryStatusBarItem: vscode.StatusBarItem;
let hourlyRate: number = 0;
let currency: string = 'USD';
let interval: NodeJS.Timeout | undefined;
let startTime: number = 0;
let elapsedTime: number = 0;

export function activate(context: vscode.ExtensionContext) {

	// Initialize settings
	const config = vscode.workspace.getConfiguration('liveSalary');
	hourlyRate = config.get<number>('hourlyRate', 25);
	currency = config.get<string>('currency', 'USD');

	// Create a status bar item
	salaryStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);

	// Command to start shift
	let startShiftCommand = vscode.commands.registerCommand('liveSalary.startShift', () => {
		startShift(0);
	});

	// Command to start shift with offset
	let startShiftWithOffsetCommand = vscode.commands.registerCommand('liveSalary.startShiftWithOffset', async () => {
		const offset = await vscode.window.showInputBox({ prompt: 'Enter minutes already worked:', value: '0' });
		const offsetMinutes = offset ? parseInt(offset) : 0;
		startShift(offsetMinutes * 60 * 1000);
	});

	// Command to end shift
	let endShiftCommand = vscode.commands.registerCommand('liveSalary.endShift', () => {
		endShift();
	});

	// Add commands to the context
	context.subscriptions.push(startShiftCommand);
	context.subscriptions.push(startShiftWithOffsetCommand);
	context.subscriptions.push(endShiftCommand);
}

function startShift(offset: number) {
	// Set the start time
	startTime = Date.now() - offset;

	// Clear any previous interval
	if (interval) {
		clearInterval(interval);
	}

	// Start the salary update
	interval = setInterval(updateSalary, 1000);

	// Show the status bar item
	salaryStatusBarItem.show();
}

function updateSalary() {
	// Get user settings for currency position
	const config = vscode.workspace.getConfiguration('liveSalary');
	const currencyPosition = config.get<string>('currencyPosition', 'left');

	// Calculate the elapsed time in hours
	elapsedTime = Date.now() - startTime;
	const hoursWorked = elapsedTime / (1000 * 60 * 60);

	// Calculate salary
	const salary = hourlyRate * hoursWorked;

	// Format salary with currency based on position
	let salaryText: string;
	if (currencyPosition === 'left') {
		salaryText = `${currency} ${salary.toFixed(2)}`;
	} else {
		salaryText = `${salary.toFixed(2)} ${currency}`;
	}

	// Update the status bar with the salary
	salaryStatusBarItem.text = salaryText;
}

function endShift() {
	// Hide the status bar item and clear the interval
	salaryStatusBarItem.hide();
	if (interval) {
		clearInterval(interval);
		interval = undefined;
	}

	// Reset start time and elapsed time
	startTime = 0;
	elapsedTime = 0;
}

export function deactivate() {
	if (interval) {
		clearInterval(interval);
	}
}
