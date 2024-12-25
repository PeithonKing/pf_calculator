const DEFAULT_INTEREST_RATE = 8;
// var START_YEAR;
// var END_YEAR;

var head = null;

function interest_rate(year, month) {
    return DEFAULT_INTEREST_RATE;
}







class YearTable {  // sort of like a linked list

    constructor(year, last_yeartable = null, opening_balance = null) {

        // Enforce passing only one of last_yeartable or opening_balance
        if (
            (last_yeartable === null && opening_balance === null) ||
            (last_yeartable !== null && opening_balance !== null)
        ) {
            console.log(last_yeartable, opening_balance);
            throw new Error('One and only one of last_yeartable or opening_balance should be passed');
        }

        // Initialize some properties
        this.year = year;
        this.opening_balance = opening_balance;
        this.total_deposit = 0;
        this.total_withdrawal = 0;
        this.total_interest = 0;
        this.closing_balance = 0;
        this.table = null;

        // linking the previous and next year tables
        this.previous_year = last_yeartable ? last_yeartable : null;
        if (last_yeartable) last_yeartable.next_yeartable = this;
        this.next_yeartable = null;

        // Initialize the table and add event listeners
        this.data = this.generateGenericData();
        this.recalculateBalances();


        this.table = this.generateNewTable();
        this.table.on("cellEdited", (cell) => {
            // console.log("cellEdited event fired");
            // console.log(cell);
            this.data = this.table.getData();   
            this.updateChain();
        });
    }

    generateGenericData() {
        const data = [];
        const monthNames = ["April", "May", "June", "July", "August", "September", "October", "November", "December", "January", "February", "March"];
        for (const month of monthNames) {
            data.push({
                month: month,
                openingBalance: 0,
                salaryBefore15: { amount: 0  , tvNumber: '', date: '' },
                additionalBefore15: { amount: 0, challanNumber: '', date: '' },
                salaryAfter15: { amount: 0, tvNumber: '', date: '' },
                additionalAfter15: { amount: 0, challanNumber: '', date: '' },
                withdrawal: 0,
                lowestBalance: 0,   
                closingBalance: 0,
                interest: 0,
                rate: interest_rate(this.year, month),
            });
        }
        return data;
    }

    generateNewTable() {
        return new Tabulator(`#pf-table-${this.year}`, {
            // data: this.data,
            data: this.round_data(),   
            layout: "fitData",
            movableRows: false,
            columns: [
                {title: "Month", field: "month", editor: false, headerSort: false, headerHozAlign: "center"},
                {title: "Opening Balance", field: "openingBalance", editor: false, headerSort: false, headerHozAlign: "center"},
                {title: "Before 15th", headerHozAlign: "center", columns: [
                    {title: "Salary", headerHozAlign: "center", columns: [
                        {title: "Amount", field: "salaryBefore15.amount", editor: "number", headerSort: false, headerHozAlign: "center"},
                        {title: "TV Number", field: "salaryBefore15.tvNumber", editor: "input", headerSort: false, headerHozAlign: "center"},
                        {title: "Date", field: "salaryBefore15.date", editor: "input", headerSort: false, headerHozAlign: "center"}
                    ]},
                    {title: "Additional", headerHozAlign: "center", columns: [
                        {title: "Amount", field: "additionalBefore15.amount", editor: "number", headerSort: false, headerHozAlign: "center"},
                        {title: "Challan No.", field: "additionalBefore15.challanNumber", editor: "input", headerSort: false, headerHozAlign: "center"},
                        {title: "Date", field: "additionalBefore15.date", editor: "input", headerSort: false, headerHozAlign: "center"}
                    ]}
                ]},
                {title: "After 15th", headerHozAlign: "center", columns: [
                    {title: "Salary", headerHozAlign: "center", columns: [
                        {title: "Amount", field: "salaryAfter15.amount", editor: "number", headerSort: false, headerHozAlign: "center"},
                        {title: "TV Number", field: "salaryAfter15.tvNumber", editor: "input", headerSort: false, headerHozAlign: "center"},
                        {title: "Date", field: "salaryAfter15.date", editor: "input", headerSort: false, headerHozAlign: "center"}
                    ]},
                    {title: "Additional", headerHozAlign: "center", columns: [
                        {title: "Amount", field: "additionalAfter15.amount", editor: "number", headerSort: false, headerHozAlign: "center"},
                        {title: "Challan No.", field: "additionalAfter15.challanNumber", editor: "input", headerSort: false, headerHozAlign: "center"},
                        {title: "Date", field: "additionalAfter15.date", editor: "input", headerSort: false, headerHozAlign: "center"}
                    ]}
                ]},
                {title: "Withdrawal", field: "withdrawal", editor: "number", headerSort: false, headerHozAlign: "center"},
                {title: "Lowest Balance", field: "lowestBalance", editor: false, headerSort: false, headerHozAlign: "center"},
                {title: "Closing Balance", field: "closingBalance", editor: false, headerSort: false, headerHozAlign: "center"},
                {title: "Interest", field: "interest", editor: false, headerSort: false, headerHozAlign: "center"},
                {title: "Rate (%)", field: "rate", editor: false, headerSort: false, headerHozAlign: "center"}
            ]
        });
    }

    updateChain() {
        this.recalculateBalances();
        if (this.next_yeartable !== null) {
            this.next_yeartable.updateChain();
        }
    }

    round_data() {
        let copy_data = JSON.parse(JSON.stringify(this.data));
        copy_data = copy_data.map(row => {
            row.openingBalance = row.openingBalance.toFixed(0);
            row.lowestBalance = row.lowestBalance.toFixed(0);
            row.closingBalance = row.closingBalance.toFixed(0);
            row.interest = row.interest.toFixed(0);
            return row;
        });

        console.log("copy_data: ", copy_data);

        // if (this.table) this.table.setData(copy_data);

        return copy_data;
    }

    recalculateBalances() {

        // console.log("recalculateBalances called for year: ", this.year);    

        this.opening_balance = this.previous_year ? this.previous_year.closing_balance : this.opening_balance;

        // console.log(this.year, this.opening_balance);   
        // Recalculate the table
        this.data = this.data.map((row, index) => {
            row.openingBalance = index === 0 ? this.opening_balance : this.data[index - 1].closingBalance;
            const depositsBefore15 = row.salaryBefore15.amount + row.additionalBefore15.amount;
            row.lowestBalance = row.openingBalance + depositsBefore15 - row.withdrawal;
            const depositsAfter15 = row.salaryAfter15.amount + row.additionalAfter15.amount;
            row.closingBalance = row.lowestBalance + depositsAfter15;
            // row.interest = (row.lowestBalance * row.rate / 1200).toFixed(2);
            row.interest = row.lowestBalance * row.rate / 1200;
            return row;
        });
        // console.log("this.table: ", this.table);
        // console.log("this.table.getData(): ", this.table.getData());
        // console.log("this.generateGenericData(): ", this.generateGenericData()  );
        // this.updateTable();
        if (this.table) this.table.setData(this.round_data());
        
        this.total_deposit = this.data.reduce((acc, row) => acc + row.salaryBefore15.amount + row.additionalBefore15.amount + row.salaryAfter15.amount + row.additionalAfter15.amount, 0);
        this.total_withdrawal = this.data.reduce((acc, row) => acc + row.withdrawal, 0);
        this.total_interest = this.data.reduce((acc, row) => acc + row.interest, 0);
        this.closing_balance = this.opening_balance + this.total_deposit - this.total_withdrawal + this.total_interest;

        // console.log("this.total_deposit: ", this.total_deposit);
        // console.log("this.total_withdrawal: ", this.total_withdrawal);
        // console.log("this.total_interest: ", this.total_interest);
        // console.log("this.closing_balance: ", this.closing_balance);

        document.getElementById(`${this.year}-total-deposit`).textContent = `Total Deposit: ${this.total_deposit.toFixed(0)}`;
        document.getElementById(`${this.year}-total-withdrawal`).textContent = `Total Withdrawal: ${this.total_withdrawal.toFixed(0)}`;
        document.getElementById(`${this.year}-total-interest`).textContent = `Total Interest: ${this.total_interest.toFixed(0)}`;
        document.getElementById(`${this.year}-closing-balance`).textContent = `Closing Balance: ${this.closing_balance.toFixed(0)}`;
    }
}



function addYearSection(year, last_yeartable = null, opening_balance = null) {
    let container = document.getElementById('container');
    const yearRange = `Year: ${year} - ${year + 1}`; 
    const yearSection = document.createElement('div');
    yearSection.classList.add('year');
  
    const yearHeading = document.createElement('h2');
    yearHeading.classList.add('text-center');
    yearHeading.textContent = yearRange;
  
    const pfTableContainer = document.createElement('div');
    pfTableContainer.id = `pf-table-${year}`;

    const totalDeposit = document.createElement('p');
    totalDeposit.id = `${year}-total-deposit`;

    const totalWithdrawal = document.createElement('p');
    totalWithdrawal.id = `${year}-total-withdrawal`;

    const totalInterest = document.createElement('p');
    totalInterest.id = `${year}-total-interest`;

    const closingBalance = document.createElement('p');
    closingBalance.id = `${year}-closing-balance`;
  
    yearSection.appendChild(yearHeading);
    yearSection.appendChild(pfTableContainer);
    container.appendChild(yearSection);
    container.appendChild(totalDeposit);
    container.appendChild(totalWithdrawal);
    container.appendChild(totalInterest);
    container.appendChild(closingBalance);

    table = new YearTable(year, last_yeartable, opening_balance);



    return table;
}



const startbutton = document.getElementById('start');

startbutton.addEventListener('click', function() {
    // get the content of the input fields with id 'start-year' and 'end-year'
    // START_YEAR = parseInt(document.getElementById('start-year').value);
    // END_YEAR = parseInt(document.getElementById('end-year').value);
    const startYear = parseInt(document.getElementById('start-year').value);
    const endYear = parseInt(document.getElementById('end-year').value);
    const opening_balance = parseFloat(document.getElementById('opening-balance').value);

    if (endYear - startYear < 0) {
        alert(`End year (${endYear}) should be greater than start year (${startYear})`);
        return;
    } else if (endYear - startYear > 100) {
        alert('We can only calculate for a maximum of 100 years');
        return;
    } else if (endYear < 1900) {
        alert('End year should be greater than 1900');
        return;
    }

    container = document.getElementById('container');
    container.innerHTML = '';

    head = addYearSection(startYear, null, opening_balance);
    last_yeartable = head;

    for (let year = startYear+1; year <= endYear; year++) {
        last_yeartable = addYearSection(year, last_yeartable, null);
    }

    setTimeout(() => {
        head.updateChain();
    }, 10);

});

// document.getElementById('recalculate').addEventListener('click', function() {
//     head.updateChain();
// });


