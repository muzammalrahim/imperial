import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { Observable, of, ReplaySubject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CSVRecord } from './interfaces/customer.model';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { TableColumn } from '../../../@vex/interfaces/table-column.interface';
import { aioTableData1,aioTableData, aioTableLabels,aioTableLabelsPayroll } from '../../../static-data/aio-table-data';
import icEdit from '@iconify/icons-ic/twotone-edit';
import icDelete from '@iconify/icons-ic/twotone-delete';
import icSearch from '@iconify/icons-ic/twotone-search';
import icAdd from '@iconify/icons-ic/twotone-add';
import icFilterList from '@iconify/icons-ic/twotone-filter-list';
import { SelectionModel } from '@angular/cdk/collections';
import icMoreHoriz from '@iconify/icons-ic/twotone-more-horiz';
import icFolder from '@iconify/icons-ic/twotone-folder';
import { fadeInUp400ms } from '../../../@vex/animations/fade-in-up.animation';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldDefaultOptions } from '@angular/material/form-field';
import { stagger40ms } from '../../../@vex/animations/stagger.animation';
import { FormControl } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import icPhone from '@iconify/icons-ic/twotone-phone';
import icMail from '@iconify/icons-ic/twotone-mail';
import icMap from '@iconify/icons-ic/twotone-map';
import { AuthService } from 'src/app/services/auth.service';
import { ExportService } from 'src/app/services/export.service';

import roundImportExport from '@iconify/icons-ic/round-import-export';
import { Payroll } from 'src/app/models/payroll.model';

@UntilDestroy()
@Component({
  selector: 'vex-payroll',
  templateUrl: './payroll.component.html',
  styleUrls: ['./payroll.component.scss'],
  animations: [
    fadeInUp400ms,
    stagger40ms
  ],
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: {
        appearance: 'standard'
      } as MatFormFieldDefaultOptions
    }
  ]
})
export class PayrollComponent implements OnInit, AfterViewInit {
  public records: any[] = [];
  layoutCtrl = new FormControl('boxed');
  roundImportExport = roundImportExport;
  lines = []; //for headings
  linesR = []; // for rows
  loading = false;
  /**
   * Simulating a service with HTTP that returns Observables
   * You probably want to remove this and do all requests in a service with HTTP
   */
  subject$: ReplaySubject<Payroll[]> = new ReplaySubject<Payroll[]>(1);
  data$: Observable<Payroll[]> = this.subject$.asObservable();
  clients: Payroll[];

  @Input()
  columns: TableColumn<Payroll>[] = [
    // { label: 'Checkbox', property: 'checkbox', type: 'checkbox', visible: true },
    // { label: 'Image', property: 'profilePhoto', type: 'image', visible: true },
    { label: 'Log ID', property: 'logID', type: 'text', visible: true, cssClasses: ['font-medium'] },
    { label: 'Timestamp', property: 'timestampStr', type: 'text', visible: true },
    { label: 'User', property: 'name', type: 'text', visible: true },
    { label: 'Type', property: 'type', type: 'text', visible: true },
    { label: 'Period', property: 'period', type: 'text', visible: true },
    { label: 'Response', property: 'response', type: 'button', visible: true }
  ];
  pageSize = 10;
  pageSizeOptions: number[] = [5, 10, 20, 50];
  dataSource: MatTableDataSource<Payroll> | null;
  selection = new SelectionModel<Payroll>(true, []);
  searchCtrl = new FormControl();

  labels = aioTableLabels;
  responses = aioTableLabelsPayroll;
  icPhone = icPhone;
  icMail = icMail;
  icMap = icMap;
  icEdit = icEdit;
  icSearch = icSearch;
  icDelete = icDelete;
  icAdd = icAdd;
  icFilterList = icFilterList;
  icMoreHoriz = icMoreHoriz;
  icFolder = icFolder;
  currentUser;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(private dialog: MatDialog,
    private authService:AuthService,
    private exportService:ExportService) {
      if (!this.authService.currenctUser) {
        this.authService.setCurrentUser();
      }
      this.currentUser = this.authService.currenctUser;
  }

  get visibleColumns() {
    return this.columns.filter(column => column.visible).map(column => column.property);
  }

  /**
   * Example on how to get data and pass it to the table - usually you would want a dedicated service with a HTTP request for this
   * We are simulating this request here.
   */
  getData() {
    this.authService.getAllPayroll().subscribe((clients)=>{
      of(clients.map(client =>new Payroll(client))).subscribe(clientes =>{
        console.log('123213123')
        console.log(clientes)
        this.subject$.next(clientes)
      });
    })
    // return of(aioTableData1.map(client => new Payroll(client))).subscribe(clients =>{
    //   this.subject$.next(clients);
    // });
  }

  ngOnInit() {
    this.getData();

    this.dataSource = new MatTableDataSource();

    this.data$.pipe(
      filter<Payroll[]>(Boolean)
    ).subscribe(clients => {
      this.clients = clients;
      this.dataSource.data = clients;
    });

    this.searchCtrl.valueChanges.pipe(
      untilDestroyed(this)
    ).subscribe(value => this.onFilterChange(value));
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  onFilterChange(value: string) {
    if (!this.dataSource) {
      return;
    }
    value = value.trim();
    value = value.toLowerCase();
    this.dataSource.filter = value;
  }

  toggleColumnVisibility(column, event) {
    event.stopPropagation();
    event.stopImmediatePropagation();
    column.visible = !column.visible;
  }

  trackByProperty<T>(index: number, column: TableColumn<T>) {
    return column.property;
  }

  exportElmToCsv(data): void {
    console.log('export data', data[0].timesheet_id)
    this.exportService.exportToCsv(data, 'Timesheet:'+data[0].timesheet_id,['WR_RATE', 'WR_REF', 'WR_TRNCDE', 'WR_UNITS']);
  }

  exportTimesheets(){
    this.authService.openSnackbar('Please wait while your export sheets are getting ready.')
    this.authService.getExportTimesheets().subscribe((res)=>{
      console.log('res')
    if(res.length > 0) {
        console.log('finalRateObjs', res);
        this.exportElmToCsv(res)
        if(res[0].response === 'Successful'){
          // console.log('finalRateObjs');
          this.getData();
        }

      }
      else{
        this.authService.openSnackbar('No new timesheet to export')
      }
    })
  }
  generateWorkerID(){
    this.authService.getGenerateWorkerID().subscribe((res)=>{
      console.log('res')
      console.log(res)
      if(res.fullname){
        this.authService.openSnackbar('Already Generated');

      }else{
          if(res.length  == 0){
          this.authService.openSnackbar('No Data')
        }else{
          // this.getData();
          of(res.map(client =>new Payroll(client))).subscribe(clientes =>{
            console.log('123213123')
            console.log(clientes)
            this.subject$.next(clientes)
          });
          this.authService.openSnackbar('Gnerated Successfully')
        }
      }

    },(err)=>{
      this.authService.openSnackbar('Error')
    })
  }

  importPayroll($event: any): void {

    let text = [];
    let files = $event.srcElement.files;

    if (this.isValidCSVFile(files[0])) {

      let input = $event.target;
      let reader = new FileReader();
      reader.readAsText(input.files[0]);

      reader.onload = () => {
        let csvData = reader.result;
        let csvRecordsArray = (<string>csvData).split(/\r\n|\n/);

        let headersRow = this.getHeaderArray(csvRecordsArray);

        this.records = this.getDataRecordsArrayFromCSVFile(csvRecordsArray, headersRow.length);
        console.log('csvRecordsArray', this.records )
        this.authService.getImportPayroll(this.records, this.currentUser.firstName+' '+ this.currentUser.lastName).subscribe((res)=>{
          console.log('ImportPayroll', res)
          if(res.length > 0){
            of(res.map(payrol =>new Payroll(payrol))).subscribe(payrols =>{
              console.log('payrols', payrols)
              this.subject$.next(payrols)
            });
          }
        });
      };

      reader.onerror = function () {
        console.log('error is occured while reading file!');
      };

    } else {
      alert("Please import valid .csv file.");
      this.fileReset();
    }
  }

  getDataRecordsArrayFromCSVFile(csvRecordsArray: any, headerLength: any) {
    let csvArr = [];

    for (let i = 1; i < csvRecordsArray.length; i++) {
      let curruntRecord = (<string>csvRecordsArray[i]).split(',');
      if (curruntRecord.length == headerLength) {
        let csvRecord: CSVRecord = new CSVRecord();
        csvRecord.empCode = curruntRecord[0].trim();
        csvRecord.name = curruntRecord[1].trim();
        csvRecord.tax = curruntRecord[2].trim();
        csvRecord.ni_ees = curruntRecord[3].trim();
        csvRecord.gross_toDate = curruntRecord[4].trim();
        csvRecord.tax_toDate = curruntRecord[5].trim();
        csvRecord.ni_toDate = curruntRecord[6].trim();
        csvRecord.t_deductions = curruntRecord[7].trim();
        csvRecord.net_pay = curruntRecord[9].trim();
        csvRecord.ni_code = curruntRecord[10].trim();
        csvRecord.pay_date = curruntRecord[11].trim();
        csvRecord.week_no = curruntRecord[12].trim();
        csvRecord.tax_code = curruntRecord[13].trim();
        csvRecord.wk1m1 = curruntRecord[14].trim();
        csvRecord.ni_number = curruntRecord[15].trim();
        csvRecord.student_loan = curruntRecord[16].trim();
        csvRecord.pension = curruntRecord[17].trim();
        csvArr.push(csvRecord);
      }
    }
    return csvArr;
  }

  isValidCSVFile(file: any) {
    return file.name.endsWith(".csv");
  }

  getHeaderArray(csvRecordsArr: any) {
    let headers = (<string>csvRecordsArr[0]).split(',');
    let headerArray = [];
    for (let j = 0; j < headers.length; j++) {
      headerArray.push(headers[j]);
    }
    return headerArray;
  }

  fileReset() {
    console.log('fileReset');
  }

}
